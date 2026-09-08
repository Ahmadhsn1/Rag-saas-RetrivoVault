/**
 * Strips MongoDB operator injection ($-prefixed keys, dotted keys) from
 * req.body / req.query / req.params. Lightweight, no dependency.
 */
function scrub(value, depth = 0) {
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith("$") || k.includes(".")) continue;
    out[k] = scrub(v, depth + 1);
  }
  return out;
}

export function mongoSanitize(req, _res, next) {
  if (req.body && typeof req.body === "object") req.body = scrub(req.body);
  if (req.query && typeof req.query === "object") {
    // req.query is a getter-only in Express 5; safe to reassign in 4
    try {
      req.query = scrub(req.query);
    } catch {
      /* ignore */
    }
  }
  if (req.params && typeof req.params === "object") req.params = scrub(req.params);
  next();
}

/** Safe string coercion for user input. Non-strings become "". */
export const str = (v) => (typeof v === "string" ? v : "");
