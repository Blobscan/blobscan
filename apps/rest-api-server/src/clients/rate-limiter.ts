import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

import { redis } from "./redis";

/**
 * `requestsPerSecond` per client, counted in Redis so every API instance
 * shares the same counters. If Redis is unreachable it falls back to an
 * in-memory counter per instance: a looser limit, but never none.
 */
export function createRedisRateLimiter(
  keyPrefix: string,
  requestsPerSecond: number
) {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points: requestsPerSecond,
    duration: 1,
    rejectIfRedisNotReady: true,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix,
      points: requestsPerSecond,
      duration: 1,
    }),
  });
}
