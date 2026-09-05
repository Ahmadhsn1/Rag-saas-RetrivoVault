import { describe, it, expect } from "vitest";
import request from "supertest";
import { app, makeUser, auth } from "../test/helpers.js";
import { Document } from "../models/Document.js";
import { Chunk } from "../models/Chunk.js";
import { drain } from "./jobQueue.js";
import { extractText } from "../utils/textExtractor.js";

describe("ingestion queue", () => {
  it("processes an uploaded .txt file end-to-end to 'ready'", async () => {
    const ctx = await makeUser();
    const body = "Retrivo Vault is a retrieval augmented generation platform. ".repeat(
      5
    );

    const res = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .attach("file", Buffer.from(body), "notes.txt");
    expect(res.status).toBe(202);
    expect(res.body.document.status).toBe("processing");

    await drain();

    const doc = await Document.findById(res.body.document._id);
    expect(doc.status).toBe("ready");
    expect(doc.chunkCount).toBeGreaterThan(0);
    expect(await Chunk.countDocuments({ documentId: doc._id })).toBe(
      doc.chunkCount
    );
  });

  it("accepts markdown and csv by extension", async () => {
    const ctx = await makeUser();

    const md = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .attach("file", Buffer.from("# Title\n\nSome **bold** prose about vectors."), "d.md");
    expect(md.status).toBe(202);

    const csv = await request(app)
      .post("/api/documents")
      .set(auth(ctx.token))
      .attach(
        "file",
        Buffer.from("name,role\nAda,mathematician\nAlan,logician"),
        "people.csv"
      );
    expect(csv.status).toBe(202);

    await drain();
    const docs = await Document.find({ userId: ctx.user._id });
    expect(docs.every((d) => d.status === "ready")).toBe(true);
  });
});

describe("extractText formats", () => {
  it("flattens CSV rows into readable lines", async () => {
    const text = await extractText({
      buffer: Buffer.from("name,role\nAda,mathematician"),
      mimeType: "text/csv",
      filename: "p.csv",
    });
    expect(text).toMatch(/name: Ada/);
    expect(text).toMatch(/role: mathematician/);
  });

  it("strips markdown syntax", async () => {
    const text = await extractText({
      buffer: Buffer.from("## Heading\n\nText with **bold** and a [link](http://x)."),
      mimeType: "text/markdown",
      filename: "d.md",
    });
    expect(text).not.toMatch(/##/);
    expect(text).toMatch(/link/);
  });
});
