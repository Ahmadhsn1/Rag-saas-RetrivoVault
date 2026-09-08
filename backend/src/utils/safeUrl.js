import net from "node:net";
import { ApiError } from "./ApiError.js";

const ALLOW_PRIVATE = process.env.WEBHOOK_ALLOW_PRIVATE === "true";

function isPrivateHost(hostname) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname === "::1" || hostname === "0.0.0.0") return true;

  if (net.isIP(hostname) === 4) {
    const [a, b] = hostname.split(".").map(Number);
    if (a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
  }
  if (net.isIP(hostname) === 6) {
    const h = hostname.toLowerCase();
    if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
  }
  return false;
}

/**
 * Validate a user-supplied outbound URL (webhooks). Rejects non-https and,
 * unless WEBHOOK_ALLOW_PRIVATE=true, anything pointing at a private/loopback host.
 */
export function assertPublicHttpsUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw ApiError.badRequest("Invalid URL");
  }
  if (u.protocol !== "https:") {
    throw ApiError.badRequest("Webhook URL must use https");
  }
  if (!ALLOW_PRIVATE && isPrivateHost(u.hostname)) {
    throw ApiError.badRequest(
      "Webhook URL must be a public host (private/loopback addresses are blocked)"
    );
  }
  return u.toString();
}
