import { embeddingModel } from "../config/gemini.js";

const EMBED_DIM = 768;

async function embed(text, taskType) {
  const res = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    taskType,
  });
  const values = res.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIM) {
    throw new Error(
      `Unexpected embedding shape: got ${values?.length} values`
    );
  }
  return values;
}

// For stored document chunks.
export function embedDocument(text) {
  return embed(text, "RETRIEVAL_DOCUMENT");
}

// For an incoming user question.
export function embedQuery(text) {
  return embed(text, "RETRIEVAL_QUERY");
}

// Sequential batch — Gemini free tier is rate-limited, so we avoid bursts.
export async function embedDocumentBatch(texts, { onProgress } = {}) {
  const out = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(await embedDocument(texts[i]));
    onProgress?.(i + 1, texts.length);
  }
  return out;
}

export { EMBED_DIM };
