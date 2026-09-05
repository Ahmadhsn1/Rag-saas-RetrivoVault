import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env.js";

const genAI = new GoogleGenerativeAI(env.gemini.apiKey);

export const embeddingModel = genAI.getGenerativeModel({
  model: env.gemini.embeddingModel,
});

export const llmModel = genAI.getGenerativeModel({
  model: env.gemini.llmModel,
});

export { genAI };
