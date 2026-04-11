import type express from 'express';

/**
 * Configuration used to control token bucket behavior for one remote client.
 */
export interface TokenBucketOptions {
  /**
   * Maximum number of tokens a bucket can hold at one time.
   */
  capacity: number;
  /**
   * Number of tokens restored per second.
   */
  refillRate: number;
}

interface TokenBucketState {
  lastRefillAt: number;
  tokens: number;
}

/**
 * Creates an in-memory token bucket rate limiter middleware keyed by client address.
 *
 * @param options - Token bucket configuration for request admission.
 * @returns Express middleware enforcing the configured request budget.
 */
export function createTokenBucketRateLimiter(options: TokenBucketOptions): express.RequestHandler {
  const buckets = new Map<string, TokenBucketState>();
  const capacity = Math.max(1, options.capacity);
  const refillRate = Math.max(0.01, options.refillRate);

  return (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const currentBucket = buckets.get(key) ?? { lastRefillAt: now, tokens: capacity };
    const elapsedSeconds = Math.max(0, now - currentBucket.lastRefillAt) / 1000;
    const replenishedTokens = Math.min(capacity, currentBucket.tokens + elapsedSeconds * refillRate);
    const nextBucket: TokenBucketState = {
      lastRefillAt: now,
      tokens: replenishedTokens
    };

    if (replenishedTokens < 1) {
      const retryAfterSeconds = Math.max(1, Math.ceil((1 - replenishedTokens) / refillRate));

      buckets.set(key, nextBucket);
      response.setHeader('Retry-After', String(retryAfterSeconds));
      response.setHeader('X-RateLimit-Limit', String(capacity));
      response.setHeader('X-RateLimit-Remaining', '0');
      response.status(429).json({ error: 'Too Many Requests' });
      return;
    }

    nextBucket.tokens = replenishedTokens - 1;
    buckets.set(key, nextBucket);

    response.setHeader('X-RateLimit-Limit', String(capacity));
    response.setHeader('X-RateLimit-Remaining', String(Math.floor(nextBucket.tokens)));
    next();
  };
}
