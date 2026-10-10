import { Document, hashContent } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { User } from "../models/User.js";
import { extractSegments } from "../utils/textExtractor.js";
import { chunkText, MAX_CHUNKS } from "./chunkingService.js";
import { embedDocumentBatch } from "./embeddingService.js";
import { summarizeDocument, transcribePdf } from "./generationService.js";
import { registerHandler, enqueue, queueIsFull } from "./jobQueue.js";
import { saveFile, readFile, hasFile, deleteFile } from "./fileStore.js";
import { ApiError } from "../utils/ApiError.js";
import { recordEvent } from "./usage.js";
import { notify } from "./notifications.js";
import { dispatchWebhook } from "./webhooks.js";
import { planFor } from "../config/plans.js";
import { modelsFor } from "../config/gemini.js";
import { logger } from "../config/logger.js";
import { open } from "../utils/secretBox.js";

const INGEST = "ingest";

// Scanned PDFs have no text layer; above this size we don't attempt OCR.
const MAX_OCR_BYTES = 15 * 1024 * 1024;

/** Text segments for a stored file, falling back to OCR for image-only PDFs. */
async function readSegments({ buffer, doc, llmModel }) {
  try {
    return await extractSegments({
      buffer,
      mimeType: doc.mimeType,
      filename: doc.filename,
    });
  } catch (err) {
    const scannedPdf =
      err.details?.code === "no_text" && doc.mimeType === "application/pdf";
    if (!scannedPdf || buffer.length > MAX_OCR_BYTES) throw err;
    const text = await transcribePdf(buffer, llmModel);
    if (!text) throw err;
    return [{ page: null, text }];
  }
}

// The pipeline for one stored document. Updates Document.status as it goes.
async function runIngestion({ documentId }) {
  const doc = await Document.findById(documentId);
  if (!doc) return; // deleted while queued
  const { userId, collectionId } = doc;

  try {
    const keyed = await User.findById(userId).select("+geminiApiKey");
    const { embeddingModel, llmModel } = modelsFor(open(keyed?.geminiApiKey));

    const buffer = await readFile(documentId);
    const segments = await readSegments({ buffer, doc, llmModel });

    const pieces = segments
      .flatMap((s) => chunkText(s.text).map((text) => ({ text, page: s.page })))
      .slice(0, MAX_CHUNKS);
    if (pieces.length === 0) {
      throw ApiError.badRequest("No readable text was found in this document");
    }

    const rawText = segments.map((s) => s.text).join("\n\n");
    const contentHash = hashContent(rawText);

    // A resumed job may have left a partial index behind.
    await Chunk.deleteMany({ documentId });

    // Skip embedding if the user already has an identical document — copy its chunks.
    const twin = await Document.findOne({
      userId,
      contentHash,
      status: "ready",
      _id: { $ne: documentId },
    }).lean();
    const twinChunks = twin ? await Chunk.find({ documentId: twin._id }).lean() : [];

    const rows = twinChunks.length
      ? twinChunks.map(({ order, text, page, embedding }) => ({
          order,
          text,
          page,
          embedding,
        }))
      : await embedDocumentBatch(
          pieces.map((p) => p.text),
          { model: embeddingModel, title: doc.filename }
        ).then((embeddings) =>
          pieces.map((p, i) => ({ ...p, order: i, embedding: embeddings[i] }))
        );

    await Chunk.insertMany(
      rows.map((row) => ({ ...row, userId, documentId, collectionId })),
      { ordered: false }
    );
    const chunkCount = rows.length;

    // Best-effort summary + starter questions.
    const { summary, questions } = twin?.summary
      ? { summary: twin.summary, questions: twin.suggestedQuestions || [] }
      : await summarizeDocument(rawText, llmModel);

    await Document.findByIdAndUpdate(documentId, {
      status: "ready",
      chunkCount,
      contentHash,
      summary,
      suggestedQuestions: questions,
      error: null,
    });

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
    logger.warn({ documentId: String(documentId), err: err.message }, "ingestion failed");
    // Our own validation errors are written for users; anything else (provider
    // or database failures) stays in the logs.
    const reason = err.isOperational
      ? err.message
      : "We couldn't process this document. Please try again in a few minutes.";
    await Document.findByIdAndUpdate(documentId, { status: "failed", error: reason });
    await Chunk.deleteMany({ documentId }).catch(() => {});
    void notify(userId, {
      type: "ingest_failed",
      title: `"${doc.filename}" failed to process`,
      body: reason,
      link: "/app/documents",
      email: true,
    });
    void dispatchWebhook(userId, "document.failed", {
      id: String(documentId),
      filename: doc.filename,
      error: reason,
    });
    throw err; // let the queue account for the failure
  }
}

registerHandler(INGEST, runIngestion);

async function enqueueDocument(doc) {
  let priority = 0;
  try {
    const user = await User.findById(doc.userId).select("plan trialPlan trialEndsAt");
    if (user && planFor(user).features.priorityQueue) priority = 10;
  } catch {
    /* default priority */
  }
  // Transient provider errors are already retried per call (utils/retry.js).
  enqueue(INGEST, { documentId: doc._id }, { priority, maxAttempts: 1 });
}

/** Store an upload's bytes and queue it for ingestion. Paid plans get priority. */
export async function queueIngestion(doc, buffer) {
  if (queueIsFull()) {
    await Document.findByIdAndUpdate(doc._id, {
      status: "failed",
      error: "The ingestion queue is full — please retry in a few minutes.",
    });
    throw new ApiError(503, "Ingestion is busy right now — please retry shortly.");
  }
  await deleteFile(doc._id); // a retry replaces the stored bytes
  await saveFile(doc._id, buffer, {
    userId: doc.userId,
    filename: doc.filename,
    mimeType: doc.mimeType,
  });
  await enqueueDocument(doc);
}

/** Re-run the pipeline for a document whose original is already stored. */
export async function requeueStored(doc) {
  if (queueIsFull()) {
    throw new ApiError(503, "Ingestion is busy right now — please retry shortly.");
  }
  await enqueueDocument(doc);
}

/**
 * Called on boot: documents still "processing" were interrupted by a restart.
 * Their bytes are in the file store, so pick them back up.
 */
export async function resumeInterruptedIngestion() {
  const pending = await Document.find({ status: "processing" }).sort({ uploadedAt: 1 });
  let resumed = 0;
  for (const doc of pending) {
    if (!queueIsFull() && (await hasFile(doc._id))) {
      await enqueueDocument(doc);
      resumed += 1;
    } else {
      doc.status = "failed";
      doc.error = "Processing was interrupted — please upload this file again.";
      await doc.save();
    }
  }
  return { resumed, failed: pending.length - resumed };
}
