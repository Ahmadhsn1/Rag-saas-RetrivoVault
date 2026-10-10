import { describe, it, expect, vi } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { ChatSession } from "../models/ChatSession.js";
import { User } from "../models/User.js";
import { retrieveChunks } from "../services/retrievalService.js";
import { modelsFor } from "../config/gemini.js";
import { seal, open } from "../utils/secretBox.js";
import { assertResolvesPublic } from "../utils/safeUrl.js";

// $vectorSearch only exists on Atlas, so retrieval is stubbed here.
vi.mock("../services/retrievalService.js", () => ({ retrieveChunks: vi.fn() }));

const chunk = (text, filename) => ({
  _id: new mongoose.Types.ObjectId(),
  documentId: new mongoose.Types.ObjectId(),
  text,
  filename,
  score: 0.9,
});

const events = (body) =>
  body
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => ({
      event: frame.match(/^event: (.+)$/m)[1],
      data: JSON.parse(frame.match(/^data: (.+)$/m)[1]),
    }));

async function ask(ctx, sessionId, content) {
  const res = await request(app)
    .post(`/api/chat/${sessionId}/message`)
    .set(auth(ctx.token))
    .send({ content });
  return { res, events: events(res.text) };
}

describe("chat answers", () => {
  it("streams sources with filename + full passage, and stores only cited chunks", async () => {
    const ctx = await makeUser();
    const cited = chunk("The contract renews annually.", "acme.pdf");
    const uncited = chunk("Unrelated passage.", "notes.md");
    retrieveChunks.mockResolvedValue([cited, uncited]);

    const { body } = await request(app).post("/api/chat").set(auth(ctx.token)).send({});
    const out = await ask(ctx, body.session._id, "When does it renew?");

    expect(out.res.status).toBe(200);
    const [sources, ...rest] = out.events;
    expect(sources.data.sources[0]).toMatchObject({
      index: 1,
      filename: "acme.pdf",
      text: "The contract renews annually.",
    });
    expect(rest.at(-1).event).toBe("done");

    const saved = await ChatSession.findById(body.session._id).lean();
    expect(saved.messages).toHaveLength(2);
    // the stub answer is "stub answer [1]" — only passage 1 was cited
    expect(saved.messages[1].citedChunkIds.map(String)).toEqual([String(cited._id)]);

    const fresh = await User.findById(ctx.user._id);
    expect(fresh.usage.queriesThisPeriod).toBe(1);
  });

  it("rewrites a follow-up into a standalone query before retrieving", async () => {
    const ctx = await makeUser();
    retrieveChunks.mockResolvedValue([chunk("ctx", "a.txt")]);
    const { llmModel } = modelsFor();

    const { body } = await request(app).post("/api/chat").set(auth(ctx.token)).send({});
    await ask(ctx, body.session._id, "What is the notice period?");
    expect(retrieveChunks.mock.lastCall[0].question).toBe("What is the notice period?");

    llmModel.generate.mockResolvedValueOnce("notice period for early termination");
    await ask(ctx, body.session._id, "and for early termination?");
    expect(retrieveChunks.mock.lastCall[0].question).toBe(
      "notice period for early termination"
    );
  });

  it("a public share exposes excerpts but never the full passage", async () => {
    const ctx = await makeUser();
    retrieveChunks.mockResolvedValue([chunk("x".repeat(600), "long.pdf")]);
    const { body } = await request(app).post("/api/chat").set(auth(ctx.token)).send({});
    await ask(ctx, body.session._id, "q");

    const share = await request(app)
      .post(`/api/chat/${body.session._id}/share`)
      .set(auth(ctx.token))
      .send({});
    const pub = await request(app).get(`/api/public/shared-chats/${share.body.shareId}`);
    const source = pub.body.session.messages[1].sources[0];
    expect(source.filename).toBe("long.pdf");
    expect(source.preview).toHaveLength(240);
    expect(source.text).toBeUndefined();
  });
});

describe("secrets at rest", () => {
  it("round-trips a sealed value and never stores it in the clear", () => {
    const sealed = seal("plain-secret-value-000000");
    expect(sealed).not.toContain("plain-secret");
    expect(open(sealed)).toBe("plain-secret-value-000000");
    expect(open(sealed.slice(0, -4) + "AAAA")).toBeNull(); // tampered
    expect(open("legacy-plain-key")).toBe("legacy-plain-key");
  });

  it("stores a bring-your-own Gemini key encrypted", async () => {
    const ctx = await makeUser({ keepTrial: true });
    const key = "not-a-real-key-0123456789abcdef";
    const res = await request(app)
      .put("/api/account/gemini-key")
      .set(auth(ctx.token))
      .send({ key });
    expect(res.status).toBe(200);
    const raw = await User.findById(ctx.user._id).select("+geminiApiKey").lean();
    expect(raw.geminiApiKey).not.toContain(key);
    expect(open(raw.geminiApiKey)).toBe(key);
  });
});

describe("SSRF: resolved addresses", () => {
  it("rejects a public-looking literal that maps to a private address", async () => {
    await expect(assertResolvesPublic("https://[::ffff:127.0.0.1]/x")).rejects.toThrow();
    await expect(assertResolvesPublic("https://127.0.0.1/x")).rejects.toThrow();
  });
});
