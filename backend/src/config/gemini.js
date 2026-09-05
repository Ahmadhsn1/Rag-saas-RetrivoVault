import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

const shared = new GoogleGenerativeAI(env.gemini.apiKey);

export const embeddingModel = shared.getGenerativeModel({
  model: env.gemini.embeddingModel,
});

export const llmModel = shared.getGenerativeModel({
  model: env.gemini.llmModel,
});

const cache = new Map();

/**
 * Returns { embeddingModel, llmModel } for a given API key.
 * Falls back to the platform key when `apiKey` is empty.
 */
export function modelsFor(apiKey) {
  if (!apiKey) return { embeddingModel, llmModel };
  if (cache.has(apiKey)) return cache.get(apiKey);

  const client = new GoogleGenerativeAI(apiKey);
  const models = {
    embeddingModel: client.getGenerativeModel({
      model: env.gemini.embeddingModel,
    }),
    llmModel: client.getGenerativeModel({ model: env.gemini.llmModel }),
  };
  cache.set(apiKey, models);
  return models;
}

export { shared as genAI };
