/**
 * In-process job queue with bounded concurrency, priority, and retry.
 *
 * This keeps the platform dependency-free and correct for a single instance.
 * For horizontal scale, swap this module for a BullMQ + Redis worker — the
 * public surface (`enqueue`, `registerHandler`, `queueStats`) is deliberately small.
 */

const handlers = new Map();
const queue = []; // { type, data, priority, attempts, maxAttempts, id }
let activeCount = 0;
let concurrency = Number(process.env.INGEST_CONCURRENCY || 2);
let seq = 0;

export function registerHandler(type, fn) {
  handlers.set(type, fn);
}

export function setConcurrency(n) {
  concurrency = Math.max(1, n);
  pump();
}

export function enqueue(type, data, { priority = 0, maxAttempts = 3 } = {}) {
  const job = {
    id: `${type}:${++seq}`,
    type,
    data,
    priority,
    attempts: 0,
    maxAttempts,
  };
  // higher priority first, then FIFO
  const idx = queue.findIndex((j) => j.priority < priority);
  if (idx === -1) queue.push(job);
  else queue.splice(idx, 0, job);
  pump();
  return job.id;
}

export function queueStats() {
  return { pending: queue.length, active: activeCount, concurrency };
}

function backoff(attempt) {
  return Math.min(1000 * 2 ** attempt, 15000);
}

function pump() {
  while (activeCount < concurrency && queue.length > 0) {
    const job = queue.shift();
    const handler = handlers.get(job.type);
    if (!handler) {
      console.error(`[jobQueue] no handler for "${job.type}"`);
      continue;
    }
    activeCount++;
    job.attempts++;

    Promise.resolve(handler(job.data))
      .catch((err) => {
        if (job.attempts < job.maxAttempts) {
          console.warn(
            `[jobQueue] ${job.id} failed (attempt ${job.attempts}), retrying: ${err.message}`
          );
          setTimeout(() => {
            queue.unshift(job);
            pump();
          }, backoff(job.attempts)).unref?.();
        } else {
          console.error(
            `[jobQueue] ${job.id} permanently failed: ${err.message}`
          );
          if (typeof job.data?.onPermanentFailure === "function") {
            job.data.onPermanentFailure(err).catch(() => {});
          }
        }
      })
      .finally(() => {
        activeCount--;
        pump();
      });
  }
}

/** For tests: wait until the queue is drained. */
export async function drain(timeoutMs = 15000) {
  const start = Date.now();
  while ((queue.length > 0 || activeCount > 0) && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 25));
  }
}
