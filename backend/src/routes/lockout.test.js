import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser } from "../test/helpers.js";
import { User } from "../models/User.js";

describe("login lockout", () => {
  it("locks the account after repeated failures and unlocks on reset", async () => {
    const ctx = await makeUser();

    for (let i = 0; i < 8; i++) {
      const r = await request(app)
        .post("/api/auth/login")
        .send({ email: ctx.creds.email, password: "wrongpass1" });
      expect(r.status).toBe(401);
    }

    // now locked — even the CORRECT password is refused
    const locked = await request(app)
      .post("/api/auth/login")
      .send({ email: ctx.creds.email, password: ctx.creds.password });
    expect(locked.status).toBe(429);

    // simulate the lock expiring
    await User.updateOne(
      { _id: ctx.user._id },
      { lockedUntil: new Date(Date.now() - 1000) }
    );
    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: ctx.creds.email, password: ctx.creds.password });
    expect(ok.status).toBe(200);
  });

  it("a successful login resets the failure counter", async () => {
    const ctx = await makeUser();
    await request(app)
      .post("/api/auth/login")
      .send({ email: ctx.creds.email, password: "wrongpass1" });
    await request(app)
      .post("/api/auth/login")
      .send({ email: ctx.creds.email, password: ctx.creds.password })
      .expect(200);

    const fresh = await User.findById(ctx.user._id);
    expect(fresh.failedLoginAttempts).toBe(0);
  });
});
