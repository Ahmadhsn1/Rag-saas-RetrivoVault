const UNITS = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/**
 * Parse a short duration string ("15m", "7d", "500ms", "1h") to milliseconds.
 * A bare number is treated as milliseconds.
 */
export default function ms(value) {
  if (typeof value === "number") return value;
  const m = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/i);
  if (!m) throw new Error(`Invalid duration: ${value}`);
  return Math.round(Number(m[1]) * (UNITS[(m[2] || "ms").toLowerCase()] ?? 1));
}
