import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { Document } from "../models/Document.js";

async function seed(userId, n, over = {}) {
  await Document.insertMany(
    Array.from({ length: n }, (_, i) => ({
      userId,
      filename: `file-${String(i).padStart(3, "0")}.txt`,
      mimeType: "text/plain",
      sizeBytes: 100,
      status: "ready",
      ...over,
    }))
  );
}

describe("documents listing", () => {
  it("paginates", async () => {
    const ctx = await makeUser();
    await seed(ctx.user._id, 30);

    const p1 = await request(app)
      .get("/api/documents?limit=25&page=1")
      .set(auth(ctx.token));
    expect(p1.status).toBe(200);
    expect(p1.body.documents).toHaveLength(25);
    expect(p1.body.total).toBe(30);
    expect(p1.body.pages).toBe(2);

    const p2 = await request(app)
      .get("/api/documents?limit=25&page=2")
      .set(auth(ctx.token));
    expect(p2.body.documents).toHaveLength(5);
  });

  it("filters by filename search and status", async () => {
    const ctx = await makeUser();
    await seed(ctx.user._id, 5);
    await Document.create({
      userId: ctx.user._id,
      filename: "quarterly-report.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      status: "failed",
      error: "boom",
    });

    const search = await request(app)
      .get("/api/documents?q=quarterly")
      .set(auth(ctx.token));
    expect(search.body.total).toBe(1);
    expect(search.body.documents[0].filename).toBe("quarterly-report.pdf");

    const failed = await request(app)
      .get("/api/documents?status=failed")
      .set(auth(ctx.token));
    expect(failed.body.total).toBe(1);

    const ready = await request(app)
      .get("/api/documents?status=ready")
      .set(auth(ctx.token));
    expect(ready.body.total).toBe(5);
  });

  it("only ever returns the caller's own documents", async () => {
    const a = await makeUser();
    const b = await makeUser();
    await seed(a.user._id, 3);
    await seed(b.user._id, 7);

    const res = await request(app).get("/api/documents").set(auth(b.token));
    expect(res.body.total).toBe(7);
  });
});

describe("chat session rename", () => {
  it("renames a session and rejects other users", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const { body } = await request(app)
      .post("/api/chat")
      .set(auth(a.token))
      .send({});
    const id = body.session._id;

    const ok = await request(app)
      .patch(`/api/chat/${id}`)
      .set(auth(a.token))
      .send({ title: "Vendor contract Q&A" });
    expect(ok.status).toBe(200);
    expect(ok.body.session.title).toBe("Vendor contract Q&A");

    const nope = await request(app)
      .patch(`/api/chat/${id}`)
      .set(auth(b.token))
      .send({ title: "hijack" });
    expect(nope.status).toBe(404);

    const blank = await request(app)
      .patch(`/api/chat/${id}`)
      .set(auth(a.token))
      .send({ title: "   " });
    expect(blank.status).toBe(400);
  });
});

describe("POST /api/documents/:id/retry", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("re-ingests a failed URL document", async () => {
    const { drain } = await import("../services/jobQueue.js");
    const ctx = await makeUser();
    const doc = await Document.create({
      userId: ctx.user._id,
      filename: "example.com",
      mimeType: "text/html",
      sizeBytes: 10,
      status: "failed",
      error: "boom",
      sourceUrl: "https://example.com/post",
    });

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      headers: new Map([["content-type", "text/html; charset=utf-8"]]),
      body: {
        getReader() {
          let sent = false;
          return {
            read: async () =>
              sent
                ? { done: true }
                : ((sent = true), {
                    done: false,
                    value: Buffer.from(
                      "<html><body><p>Recovered content for the retry test, long enough to chunk.</p></body></html>"
                    ),
                  }),
            cancel: async () => {},
          };
        },
      },
    }));

    const res = await request(app)
      .post(`/api/documents/${doc._id}/retry`)
      .set(auth(ctx.token));
    expect(res.status).toBe(202);
    expect(res.body.document.status).toBe("processing");

    await drain();
    const fresh = await Document.findById(doc._id);
    expect(fresh.status).toBe("ready");
  });

  it("tells the client to re-upload a failed file document", async () => {
    const ctx = await makeUser();
    const doc = await Document.create({
      userId: ctx.user._id,
      filename: "broken.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
      status: "failed",
      error: "parse error",
    });

    const res = await request(app)
      .post(`/api/documents/${doc._id}/retry`)
      .set(auth(ctx.token));
    expect(res.status).toBe(422);
    expect(res.body.details?.code).toBe("reupload_required");
  });

  it("rejects retrying a document that hasn't failed", async () => {
    const ctx = await makeUser();
    const doc = await Document.create({
      userId: ctx.user._id,
      filename: "fine.txt",
      mimeType: "text/plain",
      sizeBytes: 10,
      status: "ready",
    });
    const res = await request(app)
      .post(`/api/documents/${doc._id}/retry`)
      .set(auth(ctx.token));
    expect(res.status).toBe(400);
  });
});

describe("user entitlements in the auth payload", () => {
  it("exposes effectivePlan + resolved features (trial counts)", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Trial User",
      email: `trial-${Date.now()}@example.com`,
      password: "supersecret1",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.effectivePlan).toBe("pro"); // 14-day signup trial
    expect(res.body.user.features.byoKey).toBe(true);
    expect(res.body.user.features.apiAccess).toBe(false);
    expect(res.body.user.planLimits.documents).toBe(500);
  });
});
