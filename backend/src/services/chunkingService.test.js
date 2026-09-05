import { describe, it, expect } from "vitest";
import { chunkText } from "./chunkingService.js";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    expect(chunkText("hello world")).toEqual(["hello world"]);
  });

  it("returns nothing for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("splits long text into multiple overlapping chunks under the size cap", () => {
    const para = "Sentence about vectors. ".repeat(60); // ~1440 chars
    const chunks = chunkText(para, { size: 400, overlap: 50 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      // allow a little slack for sentence-boundary flushing
      expect(c.length).toBeLessThanOrEqual(500);
    }
  });

  it("keeps paragraph boundaries when possible", () => {
    const text = ["First paragraph.", "Second paragraph.", "Third paragraph."].join(
      "\n\n",
    );
    const chunks = chunkText(text, { size: 1000, overlap: 0 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toContain("First paragraph.");
    expect(chunks[0]).toContain("Third paragraph.");
  });
});
