/**
 * End-to-end check of retrieval against a real Atlas deployment: builds the
 * vector index in a throwaway database, indexes a few passages for two users,
 * and asserts semantic search, keyword search and per-user isolation.
 * Your real data is never touched; the scratch database is dropped at the end.
 *
 *   MONGO_URI=... node src/scripts/smokeRetrieval.js           # real Gemini embeddings
 *   MONGO_URI=... node src/scripts/smokeRetrieval.js --offline # built-in embedder, no API key
 */
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { vectorIndex } from "../config/vectorIndex.js";
import { modelsFor } from "../config/gemini.js";
import { Chunk } from "../models/Chunk.js";
import { Document } from "../models/Document.js";
import { embedDocumentBatch } from "../services/embeddingService.js";
import { retrieveChunks } from "../services/retrievalService.js";

const offline = process.argv.includes("--offline");

// A deterministic bag-of-words embedder: enough signal to prove the index,
// its filters and the ranking work, without calling a model.
const offlineModel = {
  async embed(text) {
    const words = text
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
  },
};

const CORPUS = {
  alice: {
    "msa.txt": [
      "The agreement renews automatically for one year unless either party gives sixty days written notice.",
      "Clause 14.3 sets the indemnity cap at 250000 dollars for all claims.",
    ],
    "notes.txt": ["The office plants need watering every Friday afternoon."],
  },
  bob: {
    "secret.txt": ["The merger codename is Bluebird and it renews the board mandate."],
  },
};

let failures = 0;
function check(label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
}

async function waitUntilQueryable(collection, timeoutMs = 180_000) {
  const started = Date.now();
  for (;;) {
    const [index] = await collection.listSearchIndexes(vectorIndex.name).toArray();
    if (index?.queryable) return;
    if (Date.now() - started > timeoutMs) throw new Error("vector index never became queryable");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function run() {
  if (!env.mongoUri) throw new Error("Set MONGO_URI to an Atlas deployment");
  const dbName = `retrivo_smoke_${Date.now()}`;
  await mongoose.connect(env.mongoUri, { dbName });
  const model = offline ? offlineModel : modelsFor().embeddingModel;
  console.log(`database ${dbName} · embeddings: ${offline ? "offline" : env.gemini.embeddingModel}`);

  try {
    await Chunk.init(); // builds the keyword index
    const users = {};
    for (const [name, files] of Object.entries(CORPUS)) {
      users[name] = new mongoose.Types.ObjectId();
      for (const [filename, passages] of Object.entries(files)) {
        const doc = await Document.create({
          userId: users[name],
          filename,
          mimeType: "text/plain",
          sizeBytes: passages.join("").length,
          status: "ready",
          chunkCount: passages.length,
        });
        const embeddings = await embedDocumentBatch(passages, { model, title: filename });
        await Chunk.insertMany(
          passages.map((text, order) => ({
            userId: users[name],
            documentId: doc._id,
            order,
            text,
            embedding: embeddings[order],
          }))
        );
      }
    }

    await Chunk.collection.createSearchIndex(vectorIndex);
    await waitUntilQueryable(Chunk.collection);
    // The index reports queryable slightly before the first documents land.
    await new Promise((r) => setTimeout(r, 3000));

    const ask = (who, question) =>
      retrieveChunks({ userId: users[who], question, embeddingModel: model });

    const renew = await ask("alice", "When does the agreement renew?");
    check(
      "semantic search ranks the renewal clause first",
      /renews automatically/.test(renew[0]?.text ?? ""),
      `top: ${renew[0]?.filename}, score ${renew[0]?.score?.toFixed(3)}`
    );
    check(
      "the vector index answered (not just keywords)",
      renew.some((c) => c.matchedBy.includes("semantic") && c.score > 0)
    );

    const cap = await ask("alice", "indemnity cap");
    check(
      "an exact term is matched by both halves and ranked first",
      /indemnity cap/.test(cap[0]?.text ?? "") &&
        ["semantic", "keyword"].every((k) => cap[0].matchedBy.includes(k)),
      `matched by ${cap[0]?.matchedBy.join("+")}`
    );
    check("results carry the document name", cap[0]?.filename === "msa.txt");

    const leak = await ask("alice", "merger codename Bluebird");
    check(
      "another user's passages never come back",
      leak.every((c) => !/Bluebird/.test(c.text)),
      `${leak.length} results, all Alice's`
    );
    const own = await ask("bob", "merger codename Bluebird");
    check("their owner does get them", /Bluebird/.test(own[0]?.text ?? ""));
  } finally {
    await mongoose.connection.db.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }

  console.log(failures ? `\n${failures} check(s) failed` : "\nAll retrieval checks passed");
  process.exit(failures ? 1 : 0);
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
