import { env } from "../config/env.js";
import { withRetry } from "../utils/retry.js";

// gemini-embedding-2 has no taskType parameter; the retrieval role is carried
// by a text prefix instead.
const asDocument = (text, title) => `title: ${title || "none"} | text: ${text}`;
const asQuery = (text) => `task: search result | query: ${text}`;

async function embed(text, model) {
  return withRetry(async () => {
    const values = await model.embed(text);
    if (!Array.isArray(values) || values.length !== env.gemini.embeddingDim) {
      throw new Error(`Unexpected embedding shape: got ${values?.length} values`);
    }
    return values;
  });
}

// For an incoming user question.
export function embedQuery(text, model) {
  return embed(asQuery(text), model);
}

// For stored document chunks. Runs a few requests at a time: fast enough for
// large documents without bursting past provider rate limits.
export async function embedDocumentBatch(texts, { model, title, concurrency = 4 } = {}) {
  const out = new Array(texts.length);
  let next = 0;
  const worker = async () => {
    while (next < texts.length) {
      const i = next++;
      out[i] = await embed(asDocument(texts[i], title), model);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, texts.length) }, worker)
  );
  return out;
}
