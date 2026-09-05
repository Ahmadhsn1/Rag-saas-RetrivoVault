import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { extractText } from "../utils/textExtractor.js";
import { chunkText } from "./chunkingService.js";
import { embedDocumentBatch } from "./embeddingService.js";

// Full ingestion pipeline for one uploaded file.
// Runs in the background after the upload response is sent; updates
// Document.status as it goes.
export async function ingestDocument({ documentId, userId, collectionId, file }) {
  try {
    const rawText = await extractText({
      buffer: file.buffer,
      mimeType: file.mimetype,
      filename: file.originalname,
    });

    const pieces = chunkText(rawText);
    if (pieces.length === 0) {
      throw new Error("Document produced zero chunks");
    }

    const embeddings = await embedDocumentBatch(pieces);

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
  } catch (err) {
    console.error(`[ingest] document ${documentId} failed:`, err.message);
    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
      error: err.message,
    });
    // best-effort cleanup of any partial chunks
    await Chunk.deleteMany({ documentId }).catch(() => {});
  }
}
