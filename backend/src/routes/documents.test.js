import { describe, it, expect } from "vitest";
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
