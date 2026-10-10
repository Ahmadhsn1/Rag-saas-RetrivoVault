import { env } from "./env.js";

/**
 * A model-free stand-in for the AI provider (AI_OFFLINE=true, never in
 * production). Embeddings are a deterministic bag of words and answers quote
 * the best passage, so the whole pipeline — ingest, vector index, retrieval,
 * streaming, citations — can be run and tested without an API key.
 */
function embed(text) {
  const words =
    text
      .replace(/^(task:.*?query:|title:.*?text:)/, "")
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [];
  const v = new Array(env.gemini.embeddingDim).fill(0);
  for (const word of words) {
    const stem = word.replace(/(ing|ed|s)$/, "");
    let h = 2166136261;
    for (const ch of stem) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    v[(h >>> 0) % v.length] += 1;
  }
  const norm = Math.hypot(...v) || 1;
  return v.map((x) => x / norm);
}

// The first passage of the prompt built by services/generationService.js.
function quoteTopPassage(prompt) {
  const match = prompt.match(/\[1\] \(from "[^"]*"\)\n([\s\S]*?)(?:\n\n---\n\n|\n\nQuestion:)/);
  if (!match) return "Your documents don't contain an answer to that.";
  const sentence = match[1].trim().split(/(?<=[.!?])\s+/)[0];
  return `According to your documents: ${sentence} [1]`;
}

export const offlineModels = {
  embeddingModel: { embed: async (text) => embed(text) },
  llmModel: {
    // Summaries, titles and query rewrites all have fallbacks for an empty reply.
    generate: async () => "",
    async *stream(prompt) {
      for (const word of quoteTopPassage(prompt).split(/(?<= )/)) yield word;
    },
  },
};
