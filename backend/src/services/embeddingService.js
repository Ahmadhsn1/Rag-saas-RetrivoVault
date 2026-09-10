import { embeddingModel as sharedEmbeddingModel } from "../config/gemini.js";
import { env } from "../config/env.js";
import { withRetry } from "../utils/retry.js";

const EMBED_DIM = env.gemini.embeddingDim || 768;

/**
 * L2-normalize to unit length. `gemini-embedding-001` only returns pre-normalized
 * vectors at its full 3072 dims; at any truncated size (we use 768) the caller
 * must normalize for cosine/dot-product similarity to be well-behaved.
 */
function normalize(values) {
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum);
  if (!norm || !Number.isFinite(norm)) return values;
  return values.map((v) => v / norm);
}

async function embed(text, taskType, model) {
  return withRetry(async () => {
    const res = await (model || sharedEmbeddingModel).embedContent({
      content: { parts: [{ text }] },
      taskType,
      // Ask for a 768-dim vector so the result matches the Atlas index / schema
      // regardless of the model's native dimensionality.
      outputDimensionality: EMBED_DIM,
    });
    const values = res.embedding?.values;
    if (!Array.isArray(values) || values.length !== EMBED_DIM) {
      throw new Error(
        `Unexpected embedding shape: got ${values?.length} values, expected ${EMBED_DIM}`
      );
    }
    return normalize(values);
  });
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
