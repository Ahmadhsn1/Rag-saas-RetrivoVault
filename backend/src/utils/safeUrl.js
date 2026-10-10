import net from "node:net";
import dns from "node:dns/promises";
import { ApiError } from "./ApiError.js";

const ALLOW_PRIVATE = process.env.WEBHOOK_ALLOW_PRIVATE === "true";

function isPrivateHost(hostname) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
  if (hostname === "::1" || hostname === "0.0.0.0") return true;

  // URL.hostname keeps the brackets on IPv6 literals.
  hostname = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  // IPv4-mapped IPv6 (::ffff:10.0.0.1) — judge the embedded IPv4 address.
  const mapped = hostname.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) hostname = mapped[1];
  // ...which URL parsing normalises to hex groups (::ffff:7f00:1).
  const hex = hostname.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hex) {
    const [hi, lo] = [parseInt(hex[1], 16), parseInt(hex[2], 16)];
    hostname = [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
  }

  if (net.isIP(hostname) === 4) {
    const [a, b] = hostname.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
  }
  if (net.isIP(hostname) === 6) {
    if (hostname === "::" || hostname === "::1") return true;
    if (/^(fc|fd|fe8|fe9|fea|feb)/.test(hostname)) return true;
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

/**
 * Second SSRF gate, run right before an outbound request: the hostname must
 * not *resolve* to a private address either (a public name can point inward).
 */
export async function assertResolvesPublic(rawUrl) {
  if (ALLOW_PRIVATE) return;
  const { hostname } = new URL(rawUrl);
  let addrs;
  try {
    addrs = await dns.lookup(hostname.replace(/^\[|\]$/g, ""), { all: true });
  } catch {
    throw ApiError.badRequest("That host could not be resolved");
  }
  if (addrs.some((a) => isPrivateHost(a.address))) {
    throw ApiError.badRequest("That URL points at a private address");
  }
}
