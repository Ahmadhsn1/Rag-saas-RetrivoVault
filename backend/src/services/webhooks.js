import crypto from "node:crypto";
import { Webhook } from "../models/Webhook.js";
import { logger } from "../config/logger.js";
import { withRetry } from "../utils/retry.js";

function sign(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Deliver an event to every matching active webhook for a user.
 * Fire-and-forget; retries transient failures; disables an endpoint after
 * 15 consecutive failures.
 */
export async function dispatchWebhook(userId, event, data) {
  let hooks;
  try {
    hooks = await Webhook.find({ userId, active: true, events: event });
  } catch {
    return;
  }

  for (const hook of hooks) {
    const body = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });
    const headers = {
      "content-type": "application/json",
      "x-retrivo-event": event,
      "x-retrivo-signature": sign(hook.secret, body),
      "user-agent": "Retrivo-Webhook/1",
    };

    (async () => {
      try {
        const res = await withRetry(
          async () => {
            const r = await fetch(hook.url, {
              method: "POST",
              headers,
              body,
              signal: AbortSignal.timeout(8000),
            });
            if (r.status >= 500) throw new Error(`upstream ${r.status}`);
            return r;
          },
          { retries: 2, baseMs: 800 }
        );
        hook.lastStatus = res.status;
        hook.lastDeliveryAt = new Date();
        hook.failureCount = res.ok ? 0 : hook.failureCount + 1;
      } catch (err) {
        hook.failureCount += 1;
        hook.lastStatus = 0;
        hook.lastDeliveryAt = new Date();
        logger.warn(
          { hookId: String(hook._id), err: err.message },
          "webhook delivery failed"
        );
      }
      if (hook.failureCount >= 15) hook.active = false;
      await hook.save().catch(() => {});
    })();
  }
}
