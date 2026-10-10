import { GoogleGenAI } from "@google/genai";
import { env } from "./env.js";
import { offlineModels } from "./offlineAi.js";

/**
 * Thin adapter over the Google Gen AI SDK. The rest of the codebase only sees
 * `{ embeddingModel.embed, llmModel.generate, llmModel.stream }`, so swapping
 * models (or providers) is a change to this file alone.
 */
function adapt(client) {
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
      async generate(prompt, { system, file } = {}) {
        const res = await client.models.generateContent({
          model: env.gemini.llmModel,
          contents: file
            ? [
                {
                  inlineData: {
                    mimeType: file.mimeType,
                    data: file.data.toString("base64"),
                  },
                },
                { text: prompt },
              ]
            : prompt,
          config: system ? { systemInstruction: system } : undefined,
        });
        return res.text ?? "";
      },
      async *stream(prompt, { system } = {}) {
        const stream = await client.models.generateContentStream({
          model: env.gemini.llmModel,
          contents: prompt,
          config: system ? { systemInstruction: system } : undefined,
        });
        for await (const part of stream) {
          if (part.text) yield part.text;
        }
      },
    },
  };
}

const shared = adapt(new GoogleGenAI({ apiKey: env.gemini.apiKey }));

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

  const models = adapt(new GoogleGenAI({ apiKey }));
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value);
  cache.set(apiKey, models);
  return models;
}
