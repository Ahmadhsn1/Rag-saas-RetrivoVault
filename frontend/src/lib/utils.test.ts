import { describe, expect, it } from "vitest";
import { cn, formatBytes, formatNumber, formatRelativeTime } from "./utils";

describe("cn", () => {
  it("merges and dedupes tailwind classes", () => {
    const hidden = false;
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", hidden && "hidden", "font-mono")).toBe(
      "text-sm font-mono",
    );
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5 MB");
  });
});

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1284)).toBe("1,284");
  });
});

describe("formatRelativeTime", () => {
  it("handles recent timestamps", () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("just now");
    expect(
      formatRelativeTime(new Date(Date.now() - 5 * 60_000).toISOString()),
    ).toBe("5m ago");
    expect(
      formatRelativeTime(new Date(Date.now() - 3 * 3600_000).toISOString()),
    ).toBe("3h ago");
  });
});
