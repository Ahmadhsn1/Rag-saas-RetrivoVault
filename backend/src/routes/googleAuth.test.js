import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app, makeUser } from "../test/helpers.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

const CLIENT_ID = "test-client.apps.googleusercontent.com";
const realFetch = globalThis.fetch;
const realClientId = env.google.clientId;

afterEach(() => {
  globalThis.fetch = realFetch;
  env.google.clientId = realClientId;
});

// Stands in for Google's tokeninfo endpoint.
function googleSays(claims, ok = true) {
  env.google.clientId = CLIENT_ID;
  globalThis.fetch = vi.fn(async () => ({ ok, json: async () => claims }));
}

const claims = (over = {}) => ({
  aud: CLIENT_ID,
  sub: "google-sub-1",
  email: "Grace@Example.com",
  email_verified: "true",
  name: "Grace Hopper",
  ...over,
});

const signIn = () =>
  request(app).post("/api/auth/google").send({ credential: "id-token" });

describe("Google sign-in", () => {
  it("is off unless a client id is configured", async () => {
    env.google.clientId = undefined;
    expect((await signIn()).status).toBe(404);
    const cfg = await request(app).get("/api/public/config");
    expect(cfg.body).toEqual({ googleClientId: null });
  });

  it("creates a verified account with a trial, then signs the same person in", async () => {
    googleSays(claims());
    const first = await signIn();
    expect(first.status).toBe(201);
    expect(first.body.user).toMatchObject({
      email: "grace@example.com",
      emailVerified: true,
      trialPlan: "pro",
    });
    expect(first.headers["set-cookie"]).toBeDefined();

    const again = await signIn();
    expect(again.status).toBe(200);
    expect(await User.countDocuments({ email: "grace@example.com" })).toBe(1);
  });

  it("rejects a token minted for another app, or an unverified Google email", async () => {
    googleSays(claims({ aud: "someone-else.apps.googleusercontent.com" }));
    expect((await signIn()).status).toBe(401);
    googleSays(claims({ email_verified: "false" }));
    expect((await signIn()).status).toBe(401);
    googleSays({}, false);
    expect((await signIn()).status).toBe(401);
  });

  it("linking to an unverified password account locks out whoever registered it", async () => {
    const squatter = await makeUser({ email: "grace@example.com", password: "squatter-pw-1" });
    await User.updateOne({ _id: squatter.user._id }, { emailVerified: false });

    googleSays(claims());
    const res = await signIn();
    expect(res.status).toBe(200);

    const user = await User.findById(squatter.user._id);
    expect(user.googleId).toBe("google-sub-1");
    expect(await bcrypt.compare("squatter-pw-1", user.passwordHash)).toBe(false);
  });
});
