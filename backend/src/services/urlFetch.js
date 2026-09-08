import { assertPublicHttpsUrl } from "../utils/safeUrl.js";
import { ApiError } from "../utils/ApiError.js";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = [
  "text/html",
  "text/plain",
  "text/markdown",
  "application/pdf",
];

/**
 * Fetch a user-supplied URL for ingestion. Validates against SSRF, caps the
 * response size, refuses redirects, and only accepts a small set of content types.
 * Returns { buffer, mimeType, filename }.
 */
export async function fetchUrlForIngest(rawUrl) {
  const url = assertPublicHttpsUrl(rawUrl);

  let res;
  try {
    res = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: { "user-agent": "Retrivo-Vault/1 (+ingest)" },
    });
  } catch (err) {
    throw ApiError.badRequest(`Could not fetch that URL (${err.message})`);
  }

  if (!res.ok) {
    throw ApiError.badRequest(`That URL returned ${res.status}`);
  }

  const ct = (res.headers.get("content-type") || "").split(";")[0].trim();
  const base = ALLOWED_TYPES.find((t) => ct.startsWith(t));
  if (!base) {
    throw ApiError.badRequest(
      `Unsupported content type "${ct || "unknown"}" — URLs must be HTML, text, or PDF`
    );
  }

  const len = Number(res.headers.get("content-length") || 0);
  if (len && len > MAX_BYTES) {
    throw ApiError.badRequest("That page is too large to ingest (max 8 MB)");
  }

  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw ApiError.badRequest("That page is too large to ingest (max 8 MB)");
    }
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  const u = new URL(url);
  const slug = (u.pathname.split("/").filter(Boolean).pop() || u.hostname)
    .slice(0, 80)
    .replace(/[^\w.-]/g, "-");
  const ext = base === "application/pdf" ? "pdf" : base === "text/html" ? "html" : "txt";

  return { buffer, mimeType: base, filename: `${slug || "page"}.${ext}` };
}
