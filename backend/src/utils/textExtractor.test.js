import { describe, it, expect } from "vitest";
import { extractText } from "./textExtractor.js";

describe("extractText", () => {
  it("extracts and normalizes plain text", async () => {
    const buffer = Buffer.from("line one\r\nline two   \n\n\n\nline three");
    const text = await extractText({
      buffer,
      mimeType: "text/plain",
      filename: "notes.txt",
    });
    expect(text).toBe("line one\nline two\n\nline three");
  });

  it("rejects an unsupported mime type", async () => {
    await expect(
      extractText({
        buffer: Buffer.from("x"),
        mimeType: "image/png",
        filename: "a.png",
      }),
    ).rejects.toThrow(/cannot extract/i);
  });

  it("rejects an empty document", async () => {
    await expect(
      extractText({
        buffer: Buffer.from("   \n\n  "),
        mimeType: "text/plain",
        filename: "blank.txt",
      }),
    ).rejects.toThrow(/no extractable text/i);
  });
});
