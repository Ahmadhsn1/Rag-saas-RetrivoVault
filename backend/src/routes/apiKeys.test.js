import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";

describe("API keys", () => {
  it("are locked on the free plan", async () => {
    const ctx = await makeUser();
    const res = await request(app)
      .post("/api/keys")
      .set(auth(ctx.token))
      .send({ name: "cli" });
    expect(res.status).toBe(403);
    expect(res.body.details?.code).toBe("feature_locked");
  });

  it("can be created on the max plan, returned once, and used as x-api-key", async () => {
    const ctx = await makeUser();
    await User.findByIdAndUpdate(ctx.user._id, { plan: "max" });

    const created = await request(app)
      .post("/api/keys")
      .set(auth(ctx.token))
      .send({ name: "cli" });
    expect(created.status).toBe(201);
    expect(created.body.secret).toMatch(/^rv_/);
    const secret = created.body.secret;

    // list never exposes the secret
    const list = await request(app).get("/api/keys").set(auth(ctx.token));
    expect(list.body.keys[0]).not.toHaveProperty("keyHash");
    expect(list.body.keys[0].prefix).toBe(secret.slice(0, 8));

    // the key authenticates a programmatic request
    const docs = await request(app)
      .get("/api/documents")
      .set("x-api-key", secret);
    expect(docs.status).toBe(200);

    // revoke, then it stops working
    const id = created.body.key._id;
    const del = await request(app)
      .delete(`/api/keys/${id}`)
      .set(auth(ctx.token));
    expect(del.status).toBe(204);

    const after = await request(app)
      .get("/api/documents")
      .set("x-api-key", secret);
    expect(after.status).toBe(401);
  });
});
