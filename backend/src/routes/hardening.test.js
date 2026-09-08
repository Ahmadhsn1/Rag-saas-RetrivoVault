import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { ChatSession } from "../models/ChatSession.js";
import { Collection } from "../models/Collection.js";
import { Document } from "../models/Document.js";

const GARBAGE_ID = "not-a-valid-object-id";
const MISSING_ID = "6a9ff7df04968586e6789999";

describe("hardening: malformed input never 500s", () => {
  it("malformed JSON body -> 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "x", ');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/malformed json/i);
  });

  it("oversized JSON body -> 413", async () => {
    const big = "a".repeat(2 * 1024 * 1024);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: big, password: big });
    expect([400, 413]).toContain(res.status);
  });

  it("wrong types for string fields -> 400, not a crash", async () => {
    const ctx = await makeUser();
    const res = await request(app)
      .post("/api/collections")
      .set(auth(ctx.token))
      .send({ name: { $ne: null } });
    expect([400, 201]).toContain(res.status);
    if (res.status === 201) {
      // name coerced — must be a plain string, not an object
      expect(typeof res.body.collection.name).toBe("string");
    }
  });

  it("invalid ObjectId in a path param -> 400/404, never 500", async () => {
    const ctx = await makeUser();
    for (const path of [
      `/api/documents/${GARBAGE_ID}`,
      `/api/collections/${GARBAGE_ID}`,
      `/api/chat/${GARBAGE_ID}`,
      `/api/keys/${GARBAGE_ID}`,
    ]) {
      const res = await request(app).get(path).set(auth(ctx.token));
      expect([400, 404]).toContain(res.status);
    }
    const del = await request(app)
      .delete(`/api/documents/${GARBAGE_ID}`)
      .set(auth(ctx.token));
    expect([400, 404]).toContain(del.status);
  });

  it("missing document / collection / chat -> 404", async () => {
    const ctx = await makeUser();
    for (const path of [
      `/api/documents/${MISSING_ID}`,
      `/api/chat/${MISSING_ID}`,
    ]) {
      const res = await request(app).get(path).set(auth(ctx.token));
      expect(res.status).toBe(404);
    }
  });

  it("huge text fields are truncated, not rejected with a 500", async () => {
    const ctx = await makeUser();
    const session = await ChatSession.create({ userId: ctx.user._id });
    const res = await request(app)
      .patch(`/api/chat/${session._id}`)
      .set(auth(ctx.token))
      .send({ title: "x".repeat(100000) });
    expect(res.status).toBe(200);
    expect(res.body.session.title.length).toBeLessThanOrEqual(120);
  });

  it("negative / absurd pagination params are clamped", async () => {
    const ctx = await makeUser();
    const res = await request(app)
      .get("/api/documents?page=-5&limit=99999")
      .set(auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.page).toBeGreaterThanOrEqual(1);
    expect(res.body.pageSize).toBeLessThanOrEqual(100);
  });

  it("regex metacharacters in ?q= are treated literally", async () => {
    const ctx = await makeUser();
    await Document.create({
      userId: ctx.user._id,
      filename: "report(final).pdf",
      mimeType: "application/pdf",
      sizeBytes: 1,
      status: "ready",
    });
    const res = await request(app)
      .get("/api/documents?q=" + encodeURIComponent("(final)"))
      .set(auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);

    // a catastrophic-backtracking pattern must not hang or error
    const evil = await request(app)
      .get("/api/documents?q=" + encodeURIComponent("(a+)+$"))
      .set(auth(ctx.token));
    expect(evil.status).toBe(200);
  });
});

describe("hardening: authorization", () => {
  it("no / garbage / malformed bearer tokens -> 401", async () => {
    for (const h of [
      {},
      { Authorization: "Bearer" },
      { Authorization: "Bearer garbage.token.here" },
      { Authorization: "Basic abc" },
      { Authorization: `Bearer ${"a".repeat(500)}` },
    ]) {
      const res = await request(app).get("/api/auth/me").set(h);
      expect(res.status).toBe(401);
    }
  });

  it("a token for a deleted user -> 401", async () => {
    const ctx = await makeUser();
    await request(app)
      .delete("/api/auth/account")
      .set(auth(ctx.token))
      .send({ password: ctx.creds.password })
      .expect(204);
    const res = await request(app).get("/api/auth/me").set(auth(ctx.token));
    expect(res.status).toBe(401);
  });

  it("one user cannot touch another user's resources", async () => {
    const a = await makeUser();
    const b = await makeUser();

    const col = await Collection.create({ userId: a.user._id, name: "A only" });
    const doc = await Document.create({
      userId: a.user._id,
      filename: "a.txt",
      mimeType: "text/plain",
      sizeBytes: 1,
      status: "ready",
    });
    const chat = await ChatSession.create({ userId: a.user._id });

    // B reads
    expect(
      (await request(app).get(`/api/documents/${doc._id}`).set(auth(b.token)))
        .status
    ).toBe(404);
    expect(
      (await request(app).get(`/api/chat/${chat._id}`).set(auth(b.token))).status
    ).toBe(404);
    // B mutates
    expect(
      (
        await request(app)
          .patch(`/api/collections/${col._id}`)
          .set(auth(b.token))
          .send({ name: "hijacked" })
      ).status
    ).toBe(404);
    expect(
      (
        await request(app)
          .post(`/api/chat/${chat._id}/share`)
          .set(auth(b.token))
          .send({})
      ).status
    ).toBe(404);
    // B deletes
    expect(
      (await request(app).delete(`/api/documents/${doc._id}`).set(auth(b.token)))
        .status
    ).toBe(404);

    // A's data is intact
    expect(await Document.findById(doc._id)).not.toBeNull();
    expect((await Collection.findById(col._id)).name).toBe("A only");
  });

  it("admin routes reject non-admins even with a valid token", async () => {
    const ctx = await makeUser();
    for (const path of ["/api/admin/stats", "/api/admin/users"]) {
      expect(
        (await request(app).get(path).set(auth(ctx.token))).status
      ).toBe(403);
    }
  });
});

describe("hardening: content safety", () => {
  it("stores HTML/script content verbatim (no execution, no crash)", async () => {
    const ctx = await makeUser();
    const payload = `<script>alert(1)</script><img src=x onerror=alert(1)>`;
    const { body } = await request(app)
      .post("/api/collections")
      .set(auth(ctx.token))
      .send({ name: payload });
    expect(body.collection.name).toBe(payload); // stored, not stripped or run
  });

  it("feedback on a non-existent message -> 404, not 500", async () => {
    const ctx = await makeUser();
    const session = await ChatSession.create({
      userId: ctx.user._id,
      messages: [{ role: "assistant", content: "hi" }],
    });
    const res = await request(app)
      .post(`/api/chat/${session._id}/messages/${MISSING_ID}/feedback`)
      .set(auth(ctx.token))
      .send({ rating: "up" });
    expect(res.status).toBe(404);

    const bad = await request(app)
      .post(`/api/chat/${session._id}/messages/${GARBAGE_ID}/feedback`)
      .set(auth(ctx.token))
      .send({ rating: "up" });
    expect([400, 404]).toContain(bad.status);
  });

  it("rejects an upload with no file", async () => {
    const ctx = await makeUser();
    const res = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .field("collectionId", "");
    expect(res.status).toBe(400);
  });

  it("rejects an unsupported file type", async () => {
    const ctx = await makeUser();
    const res = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .attach("file", Buffer.from("\x89PNG"), "hack.png");
    expect(res.status).toBe(400);
  });
});
