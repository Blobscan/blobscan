import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

import { redis } from "./redis";

/**
 * `requests` per `durationSeconds` per key, counted in Redis so every API
 * instance shares the same counters. If Redis is unreachable it falls back to an
 * in-memory counter per instance: a looser limit, but never none.
 */
export function createRedisRateLimiter(
  keyPrefix: string,
  requests: number,
  durationSeconds = 1
) {
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points: requests,
    duration: durationSeconds,
    rejectIfRedisNotReady: true,
    insuranceLimiter: new RateLimiterMemory({
      keyPrefix,
      points: requests,
      duration: durationSeconds,
    }),
  });
}
