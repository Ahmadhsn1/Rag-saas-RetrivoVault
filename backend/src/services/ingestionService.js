import { Document, hashContent } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { User } from "../models/User.js";
import { extractText } from "../utils/textExtractor.js";
import { chunkText } from "./chunkingService.js";
import { embedDocumentBatch } from "./embeddingService.js";
import { summarizeDocument } from "./generationService.js";
import { registerHandler, enqueue } from "./jobQueue.js";
import { recordEvent } from "./usage.js";
import { notify } from "./notifications.js";
import { dispatchWebhook } from "./webhooks.js";
import { planFor } from "../config/plans.js";
import { modelsFor } from "../config/gemini.js";

const INGEST = "ingest";

// The actual pipeline for one uploaded file. Updates Document.status as it goes.
async function runIngestion({ documentId, userId, collectionId, file }) {
  try {
    const rawText = await extractText({
      buffer: Buffer.from(file.buffer),
      mimeType: file.mimetype,
      filename: file.originalname,
    });

    const pieces = chunkText(rawText);
    if (pieces.length === 0) throw new Error("Document produced zero chunks");

    const contentHash = hashContent(rawText);

    // Skip embedding if the user already has an identical document — copy its chunks.
    const twin = await Document.findOne({
      userId,
      contentHash,
      status: "ready",
      _id: { $ne: documentId },
    }).lean();

    const keyed = await User.findById(userId).select("+geminiApiKey plan trialPlan trialEndsAt");
    const { embeddingModel, llmModel } = modelsFor(keyed?.geminiApiKey);

    let chunkCount;
    if (twin) {
      const twinChunks = await Chunk.find({ documentId: twin._id }).lean();
      await Chunk.insertMany(
        twinChunks.map((c) => ({
          userId,
          documentId,
          collectionId: collectionId || null,
          order: c.order,
          text: c.text,
          embedding: c.embedding,
        })),
        { ordered: false }
      );
      chunkCount = twinChunks.length;
    } else {
      const embeddings = await embedDocumentBatch(pieces, { model: embeddingModel });
      await Chunk.insertMany(
        pieces.map((text, i) => ({
          userId,
          documentId,
          collectionId: collectionId || null,
          order: i,
          text,
          embedding: embeddings[i],
        })),
        { ordered: false }
      );
      chunkCount = pieces.length;
    }

    // Best-effort summary + starter questions.
    const { summary, questions } = twin?.summary
      ? { summary: twin.summary, questions: twin.suggestedQuestions || [] }
      : await summarizeDocument(rawText, llmModel);

    const doc = await Document.findByIdAndUpdate(
      documentId,
      {
        status: "ready",
        chunkCount,
        contentHash,
        summary,
        suggestedQuestions: questions,
        error: null,
      },
      { new: true }
    );

    await recordEvent(userId, "ingest", chunkCount, { documentId });
    void notify(userId, {
      type: "ingest_complete",
      title: `"${doc.filename}" is ready`,
      body: summary || `${chunkCount} passages indexed and searchable.`,
      link: "/app/documents",
      email: true,
    });
    void dispatchWebhook(userId, "document.ready", {
      id: String(documentId),
      filename: doc.filename,
      chunkCount,
    });
  } catch (err) {
    console.error(`[ingest] document ${documentId} failed:`, err.message);
    const doc = await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      error: err.message,
    });
    await Chunk.deleteMany({ documentId }).catch(() => {});
    if (doc) {
      void notify(userId, {
        type: "ingest_failed",
        title: `"${doc.filename}" failed to process`,
        body: err.message.slice(0, 300),
        link: "/app/documents",
        email: true,
      });
      void dispatchWebhook(userId, "document.failed", {
        id: String(documentId),
        filename: doc.filename,
        error: err.message,
      });
    }
    throw err; // let the queue account for the failure / retry
  }
}

registerHandler(INGEST, runIngestion);

/** Enqueue an uploaded file for ingestion. Paid plans get queue priority. */
export async function queueIngestion({ documentId, userId, collectionId, file }) {
  let priority = 0;
  try {
    const user = await User.findById(userId).select("plan trialPlan trialEndsAt");
    if (user && planFor(user).features.priorityQueue) priority = 10;
  } catch {
    /* default priority */
  }

  enqueue(
    INGEST,
    {
      documentId,
      userId,
      collectionId,
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
      },
    },
    { priority, maxAttempts: 2 }
  );
}

export { runIngestion };
