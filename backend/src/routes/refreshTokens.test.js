import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser } from "../test/helpers.js";
import { RefreshToken } from "../models/RefreshToken.js";

const cookieOf = (res) => res.headers["set-cookie"];

describe("refresh token rotation", () => {
  it("rotates the cookie on every refresh and keeps the session alive", async () => {
    const { cookie } = await makeUser();

    const r1 = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(r1.status).toBe(200);
    expect(r1.body.accessToken).toBeTruthy();
    const c1 = cookieOf(r1);
    expect(c1.join()).toMatch(/rv_refresh=/);

    // the new cookie also works
    const r2 = await request(app).post("/api/auth/refresh").set("Cookie", c1);
    expect(r2.status).toBe(200);
  });

  it("detects reuse of an old token and kills the whole family", async () => {
    const { cookie } = await makeUser();

    // rotate once -> `cookie` is now the OLD token
    const r1 = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    const fresh = cookieOf(r1);

    // wait out the replay-grace window, then replay the old token
    await new Promise((r) => setTimeout(r, 50));
    const family = await RefreshToken.findOne().then((d) => d.family);
    await RefreshToken.updateMany(
      { family },
      { $set: { rotatedAt: new Date(Date.now() - 60_000) } }
    );

    const reuse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookie);
    expect(reuse.status).toBe(401);

    // even the previously-good token is now dead
    const after = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", fresh);
    expect(after.status).toBe(401);
  });

  it("logout revokes the session; logout-all revokes every session", async () => {
    const { token, cookie } = await makeUser();

    const out = await request(app).post("/api/auth/logout").set("Cookie", cookie);
    expect(out.status).toBe(204);

    const dead = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(dead.status).toBe(401);

    // a second login, then logout-all
    const relog = await makeUser({ email: "multi@example.com" });
    await request(app)
      .post("/api/auth/logout-all")
      .set("Authorization", `Bearer ${relog.token}`)
      .expect(204);
    const gone = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", relog.cookie);
    expect(gone.status).toBe(401);

    expect(token).toBeTruthy();
  });

  it("a password reset invalidates existing sessions", async () => {
    const ctx = await makeUser();
    const { issueToken } = await import("../services/authTokens.js");
    const raw = await issueToken(ctx.user._id, "password_reset");

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: raw, password: "newpassword123" })
      .expect(200);

    const dead = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ctx.cookie);
    expect(dead.status).toBe(401);
  });
});
