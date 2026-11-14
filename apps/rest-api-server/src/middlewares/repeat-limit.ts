import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RateLimiterAbstract } from "rate-limiter-flexible";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

import { redis } from "../clients/redis";

export type RepeatLimitMode = "off" | "log" | "enforce";

/**
 * Single-resource lookups only: `/blobs/<versioned hash>`, `/blobs/<hash>/data`,
 * `/transactions/<hash>` and `/blocks/<hash | number>`. List endpoints are left
 * out on purpose: paging through them repeats the same path with a different
 * query string and is legitimate.
 */
const RESOURCE_PATH_REGEX =
  /^\/(?:blobs\/0x[0-9a-f]{1,130}(?:\/data)?|transactions\/0x[0-9a-f]{1,130}|blocks\/(?:0x[0-9a-f]{1,130}|\d{1,20}))\/?$/i;

export function getRepeatLimitKey(req: Request): string | undefined {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return;
  }

  if (!RESOURCE_PATH_REGEX.test(req.path)) {
    return;
  }

  const ip = req.ip || req.socket.remoteAddress;

  if (!ip) {
    return;
  }

  return `${ip}:${req.path.toLowerCase().replace(/\/$/, "")}`;
}

export type RepeatLimitOptions = {
  limiter: Pick<RateLimiterAbstract, "consume">;
  mode: RepeatLimitMode;
  points: number;
  durationSeconds: number;
  isRedisReady?: () => boolean;
};

/**
 * Limits how often one client may fetch the same resource. It sits next to the
 * per-IP limit of the ingress and does not replace it: a client reading many
 * different blobs is unaffected, one re-fetching the same blob in a loop is not.
 *
 * It fails open. If Redis is unavailable the request goes through.
 */
export function createRepeatLimitMiddleware({
  limiter,
  mode,
  points,
  durationSeconds,
  isRedisReady = () => redis.status === "ready",
}: RepeatLimitOptions): RequestHandler {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return async (req: Request, res: Response, next: NextFunction) => {
    if (mode === "off") {
      return next();
    }

    const key = getRepeatLimitKey(req);

    if (!key || !isRedisReady()) {
      return next();
    }

    try {
      await limiter.consume(key);

      return next();
    } catch (error) {
      if (!(error instanceof RateLimiterRes)) {
        logger.warn("Repeat limit check failed, letting the request through", {
          error: error instanceof Error ? error.message : String(error),
        });

        return next();
      }

      const retryAfter = Math.max(1, Math.ceil(error.msBeforeNext / 1000));

      if (mode === "log") {
        logger.warn("Repeat limit would reject request", {
          key,
          userAgent: req.get("user-agent"),
          retryAfter,
        });

        return next();
      }

      res
        .status(429)
        .set("Retry-After", String(retryAfter))
        .json({
          code: "TOO_MANY_REQUESTS",
          message: `This resource was requested more than ${points} times in ${durationSeconds} seconds from your address. Cache the response and retry in ${retryAfter}s. Need more capacity? See https://docs.blobscan.com/`,
        });
    }
  };
}

export function createRepeatLimitFromEnv(): RequestHandler {
  const limiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "api_repeat",
    points: env.API_REPEAT_LIMIT_POINTS,
    duration: env.API_REPEAT_LIMIT_DURATION,
  });

  return createRepeatLimitMiddleware({
    limiter,
    mode: env.API_REPEAT_LIMIT_MODE,
    points: env.API_REPEAT_LIMIT_POINTS,
    durationSeconds: env.API_REPEAT_LIMIT_DURATION,
  });
}
