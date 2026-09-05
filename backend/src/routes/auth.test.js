import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

const app = createApp();

const creds = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "supersecret1",
};

describe("auth routes", () => {
  it("signs up, returns an access token, and sets a refresh cookie", async () => {
    const res = await request(app).post("/api/auth/signup").send(creds);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(res.headers["set-cookie"].join()).toMatch(/rv_refresh=/);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/signup").send(creds);
    const res = await request(app).post("/api/auth/signup").send(creds);
    expect(res.status).toBe(409);
  });

  it("rejects a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...creds, password: "short" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct credentials and rejects wrong ones", async () => {
    await request(app).post("/api/auth/signup").send(creds);

    const ok = await request(app)
      .post("/api/auth/login")
      .send({ email: creds.email, password: creds.password });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTruthy();

    const bad = await request(app)
      .post("/api/auth/login")
      .send({ email: creds.email, password: "wrongpass1" });
    expect(bad.status).toBe(401);
  });

  it("guards /api/auth/me and accepts a valid bearer token", async () => {
    const { body } = await request(app).post("/api/auth/signup").send(creds);

    const noAuth = await request(app).get("/api/auth/me");
    expect(noAuth.status).toBe(401);

    const withAuth = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${body.accessToken}`);
    expect(withAuth.status).toBe(200);
    expect(withAuth.body.user.email).toBe(creds.email);
  });

  it("refreshes an access token from the refresh cookie", async () => {
    const signup = await request(app).post("/api/auth/signup").send(creds);
    const cookie = signup.headers["set-cookie"];

    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
});
