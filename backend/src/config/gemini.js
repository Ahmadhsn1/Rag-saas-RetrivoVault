import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";
import { logger } from "./logger.js";
import { offlineModels } from "./offlineAi.js";

// Without a deadline a stalled provider call holds an ingestion slot (or a chat
// request) open forever.
const httpOptions = { timeout: Number(process.env.AI_TIMEOUT_MS || 60_000) };
// How long one model gets to answer (or to produce its first token) before the
// next one in the chain is tried.
const PER_MODEL_MS = Number(process.env.AI_MODEL_TIMEOUT_MS || 12_000);

// The preferred model first, then fallbacks for when it is overloaded.
const LLM_MODELS = [...new Set([env.gemini.llmModel, ...env.gemini.llmFallbacks])];

const COOL_OFF_MS = 60_000;
const coolingUntil = new Map();

const deadline = (ms, label) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms).unref()
  );

/**
 * Thin adapter over the Google Gen AI SDK. The rest of the codebase only sees
 * `{ embeddingModel.embed, llmModel.generate, llmModel.stream }`, so swapping
 * models (or providers) is a change to this file alone.
 */
function adapt(client) {
  // Runs `attempt(model)` down the chain until one succeeds. A model that just
  // failed sits out for a minute so later requests don't wait on it again.
  async function withFallback(attempt) {
    const rested = LLM_MODELS.filter((m) => (coolingUntil.get(m) ?? 0) < Date.now());
    let lastError;
    for (const model of rested.length ? rested : LLM_MODELS) {
      try {
        return await attempt(model);
      } catch (err) {
        lastError = err;
        coolingUntil.set(model, Date.now() + COOL_OFF_MS);
        logger.warn({ model, err: String(err.message).slice(0, 200) }, "model call failed");
      }
    }
    throw lastError;
  }

  return {
    embeddingModel: {
      // One text per call: passing several strings in `contents` yields a
      // single aggregated vector on gemini-embedding-2, not one per input.
      async embed(text) {
        const res = await client.models.embedContent({
          model: env.gemini.embeddingModel,
          contents: text,
          config: { outputDimensionality: env.gemini.embeddingDim },
        });
        return res.embeddings?.[0]?.values;
      },
    },
    llmModel: {
      // `file` ({ data: Buffer, mimeType }) is sent inline alongside the prompt.
      generate(prompt, { system, file } = {}) {
        const contents = file
          ? [
              {
                inlineData: {
                  mimeType: file.mimeType,
                  data: file.data.toString("base64"),
                },
              },
              { text: prompt },
            ]
          : prompt;
        return withFallback(async (model) => {
          const res = await Promise.race([
            client.models.generateContent({
              model,
              contents,
              config: system ? { systemInstruction: system } : undefined,
            }),
            // Reading a whole document (OCR) legitimately takes longer.
            deadline(file ? httpOptions.timeout : PER_MODEL_MS, model),
          ]);
          return res.text ?? "";
        });
      },
      async *stream(prompt, { system } = {}) {
        // Fall back only until the first token: after that the answer has begun.
        const { iterator, first } = await withFallback(async (model) => {
          const stream = await Promise.race([
            client.models.generateContentStream({
              model,
              contents: prompt,
              config: system ? { systemInstruction: system } : undefined,
            }),
            deadline(PER_MODEL_MS, model),
          ]);
          const iterator = stream[Symbol.asyncIterator]();
          const first = await Promise.race([iterator.next(), deadline(PER_MODEL_MS, model)]);
          return { iterator, first };
        });
        for (let step = first; !step.done; step = await iterator.next()) {
          if (step.value.text) yield step.value.text;
        }
      },
    },
  };
}

const shared = adapt(new GoogleGenAI({ apiKey: env.gemini.apiKey, httpOptions }));

// Bounded cache of per-user (bring-your-own-key) clients.
const MAX_CACHED = 200;
const cache = new Map();

/**
 * Returns { embeddingModel, llmModel } for a given API key.
 * Falls back to the platform key when `apiKey` is empty.
 */
export function modelsFor(apiKey) {
  if (env.aiOffline) return offlineModels;
  if (!apiKey) return shared;
  const hit = cache.get(apiKey);
  if (hit) return hit;

  const models = adapt(new GoogleGenAI({ apiKey, httpOptions }));
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value);
  cache.set(apiKey, models);
  return models;
}
