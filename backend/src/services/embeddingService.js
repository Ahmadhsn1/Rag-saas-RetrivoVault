import { embeddingModel as sharedEmbeddingModel } from "../config/gemini.js";

const EMBED_DIM = 768;

async function embed(text, taskType, model) {
  const res = await (model || sharedEmbeddingModel).embedContent({
    content: { parts: [{ text }] },
    taskType,
  });
  const values = res.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIM) {
    throw new Error(`Unexpected embedding shape: got ${values?.length} values`);
  }
  return values;
}

// For stored document chunks.
export function embedDocument(text, model) {
  return embed(text, "RETRIEVAL_DOCUMENT", model);
}

// For an incoming user question.
export function embedQuery(text, model) {
  return embed(text, "RETRIEVAL_QUERY", model);
}

// Sequential batch — Gemini free tier is rate-limited, so we avoid bursts.
export async function embedDocumentBatch(texts, { onProgress, model } = {}) {
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(await embedDocument(texts[i], model));
    onProgress?.(i + 1, texts.length);
  }
  return out;
}

export { EMBED_DIM };
