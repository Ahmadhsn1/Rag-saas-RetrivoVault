import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry.js";

describe("withRetry", () => {
  it("returns immediately on success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    expect(await withRetry(fn)).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient errors then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("429 rate limit"), { status: 429 }))
      .mockRejectedValueOnce(new Error("model overloaded"))
      .mockResolvedValue("recovered");

    const out = await withRetry(fn, { baseMs: 1, retries: 3 });
    expect(out).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry a non-transient error", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("API key not valid"));
    await expect(withRetry(fn, { baseMs: 1 })).rejects.toThrow(/api key/i);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the retry budget", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("timeout"), { status: 503 }));
    await expect(withRetry(fn, { baseMs: 1, retries: 2 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
