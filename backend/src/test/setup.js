import { beforeAll, afterAll, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Required env for src/config/env.js — set before anything imports it.
process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-000000000000000000";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-11111111111111111";
process.env.GEMINI_API_KEY ||= "test-key";
process.env.NODE_ENV = "test";

// The Gemini SDK must never be hit in tests.
vi.mock("../config/gemini.js", () => ({
  genAI: {},
  embeddingModel: {
    embedContent: vi.fn(async () => ({
      embedding: { values: Array.from({ length: 768 }, () => 0.01) },
    })),
  },
  llmModel: {
    generateContent: vi.fn(async () => ({
      response: { text: () => "stub answer [1]" },
    })),
    generateContentStream: vi.fn(async () => ({
      stream: (async function* () {
        yield { text: () => "stub " };
        yield { text: () => "answer [1]" };
      })(),
    })),
  },
}));

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
