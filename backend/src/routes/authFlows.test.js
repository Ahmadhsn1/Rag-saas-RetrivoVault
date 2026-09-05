import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";
import { Token, hashToken } from "../models/Token.js";
import { issueToken } from "../services/authTokens.js";

describe("email verification", () => {
  let ctx;
  beforeEach(async () => {
    ctx = await makeUser();
    // signup auto-verifies in test env; reset for these tests
    await User.findByIdAndUpdate(ctx.user._id, { emailVerified: false });
  });

  it("verifies with a valid token and rejects a bad one", async () => {
    const raw = await issueToken(ctx.user._id, "email_verify");

    const bad = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: "nope" });
    expect(bad.status).toBe(400);

    const ok = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: raw });
    expect(ok.status).toBe(200);
    expect(ok.body.user.emailVerified).toBe(true);

    // token is single-use
    const reuse = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: raw });
    expect(reuse.status).toBe(400);
  });

  it("resends a verification email for the logged-in user", async () => {
    const res = await request(app)
      .post("/api/auth/resend-verification")
      .set(auth(ctx.token));
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(true);
  });
});

describe("password reset", () => {
  it("always returns ok for forgot-password (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("resets the password with a valid token and lets the user log in", async () => {
    const ctx = await makeUser();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: ctx.creds.email });

    const tokenDoc = await Token.findOne({
      userId: ctx.user._id,
      type: "password_reset",
    });
    expect(tokenDoc).toBeTruthy();

    // issue a fresh known token (we only store the hash of the emailed one)
    const raw = await issueToken(ctx.user._id, "password_reset");
    expect(await Token.findOne({ tokenHash: hashToken(raw) })).toBeTruthy();

    const reset = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: raw, password: "brandnewpass9" });
    expect(reset.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: ctx.creds.email, password: "brandnewpass9" });
    expect(login.status).toBe(200);
  });

  it("rejects a short new password", async () => {
    const ctx = await makeUser();
    const raw = await issueToken(ctx.user._id, "password_reset");
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: raw, password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("account deletion", () => {
  it("requires the correct password and cascades", async () => {
    const ctx = await makeUser();

    const wrong = await request(app)
      .delete("/api/auth/account")
      .set(auth(ctx.token))
      .send({ password: "wrongpass1" });
    expect(wrong.status).toBe(401);

    const ok = await request(app)
      .delete("/api/auth/account")
      .set(auth(ctx.token))
      .send({ password: ctx.creds.password });
    expect(ok.status).toBe(204);

    expect(await User.findById(ctx.user._id)).toBeNull();
  });
});
