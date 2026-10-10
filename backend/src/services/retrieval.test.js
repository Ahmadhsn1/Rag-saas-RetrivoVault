import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { Chunk } from "../models/Chunk.js";
import { Document } from "../models/Document.js";
import { drain } from "./jobQueue.js";
import { retrieveChunks } from "./retrievalService.js";
import { resumeInterruptedIngestion } from "./ingestionService.js";
import { hasFile } from "./fileStore.js";

// The in-memory MongoDB has no $vectorSearch, so these exercise the keyword
// half of hybrid retrieval and the fallback when semantic search is down.
beforeAll(() => Chunk.init());

async function upload(ctx, text, name) {
  const res = await request(app)
    .post("/api/documents")
    .set(auth(ctx.token))
    .attach("file", Buffer.from(text), name);
  await drain();
  return res.body.document;
}

describe("hybrid retrieval", () => {
  it("finds an exact term by keyword and names the document", async () => {
    const ctx = await makeUser();
    await upload(ctx, "Clause 14.3 sets the indemnity cap at 250000 dollars.", "msa.txt");
    await upload(ctx, "The office plants need watering on Fridays.", "notes.txt");

    const hits = await retrieveChunks({ userId: ctx.user._id, question: "indemnity cap" });
    expect(hits[0]).toMatchObject({ filename: "msa.txt", matchedBy: ["keyword"] });
    expect(hits[0].text).toMatch(/indemnity/);
    expect(hits.some((h) => h.filename === "notes.txt")).toBe(false);
  });

  it("never returns another user's chunks", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    await upload(owner, "The merger codename is Bluebird.", "secret.txt");

    const hits = await retrieveChunks({ userId: other.user._id, question: "Bluebird" });
    expect(hits).toHaveLength(0);
  });
});

describe("stored originals", () => {
  it("serves the original to its owner only, as a download for non-PDFs", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const doc = await upload(owner, "<script>alert(1)</script> hello", "page.html");

    const ok = await request(app).get(`/api/documents/${doc._id}/file`).set(auth(owner.token));
    expect(ok.status).toBe(200);
    expect(ok.headers["content-disposition"]).toMatch(/^attachment/);
    expect(ok.headers["content-type"]).toMatch(/octet-stream/);

    const denied = await request(app)
      .get(`/api/documents/${doc._id}/file`)
      .set(auth(other.token));
    expect(denied.status).toBe(404);
  });

  it("removes the stored file with the document", async () => {
    const ctx = await makeUser();
    const doc = await upload(ctx, "temporary", "t.txt");
    expect(await hasFile(doc._id)).toBe(true);
    await request(app).delete(`/api/documents/${doc._id}`).set(auth(ctx.token));
    expect(await hasFile(doc._id)).toBe(false);
  });

  it("resumes a document left 'processing' by a restart", async () => {
    const ctx = await makeUser();
    const doc = await upload(ctx, "Resumable content about retention schedules.", "r.txt");
    await Chunk.deleteMany({ documentId: doc._id });
    await Document.updateOne({ _id: doc._id }, { status: "processing", chunkCount: 0 });

    const result = await resumeInterruptedIngestion();
    await drain();

    expect(result).toEqual({ resumed: 1, failed: 0 });
    const fresh = await Document.findById(doc._id);
    expect(fresh.status).toBe("ready");
    expect(await Chunk.countDocuments({ documentId: doc._id })).toBe(fresh.chunkCount);
  });
});
