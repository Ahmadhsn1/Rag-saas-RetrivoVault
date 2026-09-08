const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isRetryable = (err) => {
  const msg = String(err?.message || err || "");
  const status = err?.status ?? err?.statusCode;
  return (
    status === 429 ||
    status === 503 ||
    /\b(429|rate limit|quota|overloaded|deadline exceeded|ETIMEDOUT|ECONNRESET)\b/i.test(
      msg
    )
  );
};

/**
 * Retry an async fn on transient errors (rate limits, timeouts) with
 * exponential backoff + jitter. Non-retryable errors throw immediately.
 */
export async function withRetry(
  fn,
  { retries = 3, baseMs = 500, maxMs = 8000, onRetry } = {}
) {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries || !isRetryable(err)) throw err;
      const delay = Math.min(baseMs * 2 ** (attempt - 1), maxMs);
      const jittered = delay * (0.7 + Math.random() * 0.6);
      onRetry?.(attempt, err);
      await sleep(jittered);
    }
  }
}
