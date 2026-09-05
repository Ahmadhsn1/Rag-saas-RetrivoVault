import { env } from "../config/env.js";

// Splits raw text into overlapping chunks, preferring paragraph/sentence
// boundaries so a chunk rarely cuts mid-sentence.
export function chunkText(
  text,
  { size = env.rag.chunkSize, overlap = env.rag.chunkOverlap } = {}
) {
  const clean = text.replace(/\s+\n/g, "\n").trim();
  if (clean.length <= size) {
    return clean ? [clean] : [];
  }

  const paragraphs = clean.split(/\n{2,}/);
  const chunks = [];
  let buffer = "";

  const flush = () => {
    const trimmed = buffer.trim();
    if (trimmed) chunks.push(trimmed);
    // carry the tail as overlap for the next chunk
    buffer = overlap > 0 ? trimmed.slice(-overlap) : "";
  };

  for (const para of paragraphs) {
    if (para.length > size) {
      // hard-split an oversized paragraph on sentence boundaries
      const sentences = para.match(/[^.!?]+[.!?]*\s*/g) || [para];
      for (const sentence of sentences) {
        if ((buffer + sentence).length > size) flush();
        buffer += sentence;
      }
      continue;
    }

    if ((buffer + "\n\n" + para).length > size) flush();
    buffer += (buffer ? "\n\n" : "") + para;
  }

  const tail = buffer.trim();
  if (tail) chunks.push(tail);

  return chunks;
}
