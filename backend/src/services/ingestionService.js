import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { User } from "../models/User.js";
import { extractText } from "../utils/textExtractor.js";
import { chunkText } from "./chunkingService.js";
import { embedDocumentBatch } from "./embeddingService.js";
import { registerHandler, enqueue } from "./jobQueue.js";
import { recordEvent } from "./usage.js";
import { getPlan } from "../config/plans.js";
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

    const keyed = await User.findById(userId).select("+geminiApiKey").lean();
    const { embeddingModel } = modelsFor(keyed?.geminiApiKey);
    const embeddings = await embedDocumentBatch(pieces, {
      model: embeddingModel,
    });

    const docs = pieces.map((text, i) => ({
      userId,
      documentId,
      collectionId: collectionId || null,
      order: i,
      text,
      embedding: embeddings[i],
    }));

    await Chunk.insertMany(docs, { ordered: false });
    await Document.findByIdAndUpdate(documentId, {
      status: "ready",
      chunkCount: docs.length,
      error: null,
    });
    await recordEvent(userId, "ingest", docs.length, { documentId });
  } catch (err) {
    console.error(`[ingest] document ${documentId} failed:`, err.message);
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      error: err.message,
    });
    await Chunk.deleteMany({ documentId }).catch(() => {});
    throw err; // let the queue account for the failure / retry
  }
}

registerHandler(INGEST, runIngestion);

/** Enqueue an uploaded file for ingestion. Paid plans get queue priority. */
export async function queueIngestion({ documentId, userId, collectionId, file }) {
  let priority = 0;
  try {
    const user = await User.findById(userId).select("plan").lean();
    if (user && getPlan(user.plan).features.priorityQueue) priority = 10;
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
