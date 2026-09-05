import request from "supertest";
import { createApp } from "../app.js";

export const app = createApp();

let counter = 0;

/** Create a user and return { agent-less helpers, token, user }. */
export async function makeUser(overrides = {}) {
  counter += 1;
  const creds = {
    name: overrides.name || `User ${counter}`,
    email: overrides.email || `user${counter}-${Date.now()}@example.com`,
    password: overrides.password || "supersecret1",
  };
  const res = await request(app).post("/api/auth/signup").send(creds);
  if (res.status !== 201) {
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return {
    creds,
    token: res.body.accessToken,
    user: res.body.user,
    cookie: res.headers["set-cookie"],
  };
}

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}
