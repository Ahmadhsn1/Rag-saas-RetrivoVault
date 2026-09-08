import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { Document } from "../models/Document.js";
import { drain } from "../services/jobQueue.js";
import { htmlToText } from "../utils/textExtractor.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetchHtml(html) {
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    headers: new Map([["content-type", "text/html; charset=utf-8"]]),
    body: {
      getReader() {
        let sent = false;
        return {
          read: async () =>
            sent
              ? { done: true }
              : ((sent = true),
                { done: false, value: Buffer.from(html) }),
          cancel: async () => {},
        };
      },
    },
  }));
}

describe("htmlToText", () => {
  it("strips tags/scripts and decodes entities", () => {
    const out = htmlToText(
      `<html><head><style>x{}</style></head><body><h1>Title</h1><script>evil()</script><p>Hello&nbsp;&amp; welcome</p></body></html>`
    );
    expect(out).not.toMatch(/<[a-z]/i);
    expect(out).not.toMatch(/evil/);
    expect(out).toMatch(/Hello & welcome/);
  });
});

describe("POST /api/documents/url", () => {
  it("rejects a non-https / private URL", async () => {
    const ctx = await makeUser();
    for (const url of [
      "http://example.com/a",
      "https://127.0.0.1/a",
      "https://169.254.169.254/meta",
    ]) {
      const res = await request(app)
        .post("/api/documents/url")
        .set(auth(ctx.token))
        .send({ url });
      expect(res.status).toBe(400);
    }
  });

  it("fetches an HTML page and ingests it end-to-end", async () => {
    mockFetchHtml(
      "<html><body><h1>Vectors</h1><p>Retrieval augmented generation grounds answers in documents.</p></body></html>"
    );
    const ctx = await makeUser();
    const res = await request(app)
      .post("/api/documents/url")
      .set(auth(ctx.token))
      .send({ url: "https://example.com/rag-explained" });
    expect(res.status).toBe(202);
    expect(res.body.document.sourceUrl).toBe("https://example.com/rag-explained");

    await drain();
    const doc = await Document.findById(res.body.document._id);
    expect(doc.status).toBe("ready");
    expect(doc.chunkCount).toBeGreaterThan(0);
  });
});
