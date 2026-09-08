import { env } from "../config/env.js";

// Hard ceiling on chunks produced from one document — protects the embedder
// and the DB from a pathological input (e.g. a huge single-line file).
const MAX_CHUNKS = Number(process.env.MAX_CHUNKS_PER_DOC || 4000);

// Split a run of text with no usable boundary into fixed-size pieces.
function hardSplit(s, size) {
  const out = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out;
}

// Splits raw text into overlapping chunks, preferring paragraph/sentence
// boundaries so a chunk rarely cuts mid-sentence.
export function chunkText(
  text,
  { size = env.rag.chunkSize, overlap = env.rag.chunkOverlap } = {}
) {
  const clean = String(text).replace(/\s+\n/g, "\n").trim();
  if (clean.length <= size) {
    return clean ? [clean] : [];
  }

  const paragraphs = clean.split(/\n{2,}/);
  const chunks = [];
  let buffer = "";

  const flush = () => {
    const trimmed = buffer.trim();
    if (trimmed) chunks.push(trimmed);
    buffer = overlap > 0 ? trimmed.slice(-overlap) : "";
  };

  for (const para of paragraphs) {
    if (chunks.length >= MAX_CHUNKS) break;

    if (para.length > size) {
      const sentences = para.match(/[^.!?]+[.!?]*\s*/g) || [para];
      for (const sentence of sentences) {
        // a "sentence" can still be larger than `size` (no punctuation) — force it
        for (const piece of sentence.length > size
          ? hardSplit(sentence, size)
          : [sentence]) {
          if ((buffer + piece).length > size) flush();
          buffer += piece;
        }
      }
      continue;
    }

    if ((buffer + "\n\n" + para).length > size) flush();
    buffer += (buffer ? "\n\n" : "") + para;
  }

  const tail = buffer.trim();
  if (tail && chunks.length < MAX_CHUNKS) chunks.push(tail);

  return chunks.slice(0, MAX_CHUNKS);
}
