import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";

describe("quota enforcement", () => {
  it("blocks a collection over the free-plan limit (3)", async () => {
    const ctx = await makeUser();
    for (const n of [1, 2, 3]) {
      const r = await request(app)
        .post("/api/collections")
        .set(auth(ctx.token))
        .send({ name: `c${n}` });
      expect(r.status).toBe(201);
    }
    const over = await request(app)
      .post("/api/collections")
      .set(auth(ctx.token))
      .send({ name: "c4" });
    expect(over.status).toBe(402);
    expect(over.body.details?.code).toBe("quota_exceeded");
  });

  it("blocks an upload once the document count limit is reached", async () => {
    const ctx = await makeUser();
    // Seed 20 documents directly (free limit).
    await Document.insertMany(
      Array.from({ length: 20 }, (_, i) => ({
        userId: ctx.user._id,
        filename: `f${i}.txt`,
        mimeType: "text/plain",
        sizeBytes: 10,
        status: "ready",
      }))
    );

    const res = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .attach("file", Buffer.from("hello world"), "extra.txt");
    expect(res.status).toBe(402);
  });

  it("blocks a query once the monthly allowance is spent", async () => {
    const ctx = await makeUser();
    await User.findByIdAndUpdate(ctx.user._id, {
      "usage.queriesThisPeriod": 100,
      "usage.periodStart": new Date(),
    });

    const session = await request(app)
      .post("/api/chat")
      .set(auth(ctx.token))
      .send({});
    const res = await request(app)
      .post(`/api/chat/${session.body.session._id}/message`)
      .set(auth(ctx.token))
      .send({ content: "hi" });
    expect(res.status).toBe(402);
  });
});
