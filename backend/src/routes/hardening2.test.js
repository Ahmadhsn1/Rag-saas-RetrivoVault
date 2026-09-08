import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { User } from "../models/User.js";
import { chunkText } from "../services/chunkingService.js";
import { extractText } from "../utils/textExtractor.js";
import { assertPublicHttpsUrl } from "../utils/safeUrl.js";

describe("webhook SSRF defense", () => {
  it("rejects private / loopback / metadata hosts", () => {
    for (const url of [
      "https://localhost/hook",
      "https://127.0.0.1/hook",
      "https://10.0.0.5/hook",
      "https://192.168.1.1/hook",
      "https://169.254.169.254/latest/meta-data", // cloud metadata
      "https://172.16.0.1/x",
      "http://example.com/x", // not https
    ]) {
      expect(() => assertPublicHttpsUrl(url)).toThrow();
    }
  });

  it("accepts a normal public https URL", () => {
    expect(assertPublicHttpsUrl("https://hooks.example.com/retrivo")).toMatch(
      /^https:\/\/hooks\.example\.com/
    );
  });

  it("the webhook create endpoint blocks a metadata-IP URL (Max user)", async () => {
    const ctx = await makeUser();
    await User.updateOne({ _id: ctx.user._id }, { plan: "max" });
    const res = await request(app)
      .post("/api/webhooks")
      .set(auth(ctx.token))
      .send({ url: "https://169.254.169.254/x" });
    expect(res.status).toBe(400);
  });
});

describe("ingestion input caps", () => {
  it("chunkText hard-splits a huge single-line input and caps chunk count", () => {
    const monster = "wordwithoutspaces".repeat(50000); // ~850k chars, no boundaries
    const chunks = chunkText(monster, { size: 1000, overlap: 0 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThanOrEqual(4000);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000);
  });

  it("extractText caps runaway text length", async () => {
    process.env.MAX_EXTRACTED_CHARS = "1000";
    const text = await extractText({
      buffer: Buffer.from("a".repeat(50000)),
      mimeType: "text/plain",
      filename: "big.txt",
    });
    expect(text.length).toBe(1000);
    delete process.env.MAX_EXTRACTED_CHARS;
  });
});
