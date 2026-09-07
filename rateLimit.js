const buckets = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;

export function rateLimit(key) {
  const now = Date.now();

  const current = buckets.get(key);

  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(key, {
      startedAt: now,
      count: 1
    });

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1
    };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(
        (WINDOW_MS - (now - current.startedAt)) / 1000
      )
    };
  }

  current.count += 1;

  return {
    allowed: true,
    remaining: MAX_REQUESTS - current.count
  };
}

export function clearRateLimit(key) {
  buckets.delete(key);
}
