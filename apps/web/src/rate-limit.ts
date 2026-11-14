import type { NextApiRequest } from "next";
import { RateLimiterRedis, RateLimiterRes } from "rate-limiter-flexible";

import { env } from "./env";
import { redis } from "./redis";

const POINTS = 2;
const DURATION_SECONDS = 10;

const ratelimit = new RateLimiterRedis({
  storeClient: redis,
  points: POINTS,
  duration: DURATION_SECONDS,
});

export type RateLimitInfo = {
  retryAfterSeconds: number;
  points: number;
  durationSeconds: number;
};

/**
 * Resolves the real client IP from an incoming request.
 *
 * `X-Forwarded-For` is client-controlled, so the left-most entry is spoofable:
 * a client can prepend an arbitrary IP to evade or poison per-IP rate limiting.
 * The right-most entries, however, are appended by our own infrastructure and
 * are trustworthy. We therefore skip `TRUSTED_PROXY_COUNT` hops from the right
 * (the proxies we control) and take the next address as the real client.
 *
 * When there is no forwarded header, or the configured hop count exceeds the
 * chain length, we fall back to the direct socket peer.
 */
export function getClientIp(request: NextApiRequest): string | undefined {
  const forwardedHeader = request.headers["x-forwarded-for"];

  // A header may arrive as multiple values (string[]) and/or as a single
  // comma-separated string; normalize both into one ordered list.
  const forwardedFor = (
    Array.isArray(forwardedHeader) ? forwardedHeader : [forwardedHeader]
  )
    .filter((value): value is string => typeof value === "string")
    .flatMap((value) => value.split(","))
    .map((ip) => ip.trim())
    .filter(Boolean);

  if (forwardedFor.length > 0) {
    // Count trusted proxy hops from the right; the entry just before them is
    // the closest address our infrastructure observed, i.e. the real client.
    const clientIndex = forwardedFor.length - 1 - env.TRUSTED_PROXY_COUNT;

    if (clientIndex >= 0) {
      return forwardedFor[clientIndex];
    }
  }

  return request.socket.remoteAddress ?? undefined;
}

/**
 * Returns the details of the limit that was hit, or `false` if the request may
 * go through.
 */
export async function rateLimited(
  request: NextApiRequest
): Promise<RateLimitInfo | false> {
  if (redis.status !== "ready") {
    console.warn("Skipping rate limit check, Redis is not available");
    return false;
  }

  const ip = getClientIp(request);

  if (!ip) {
    throw new Error("IP address not found");
  }

  try {
    await ratelimit.consume(ip);
    return false;
  } catch (error) {
    return {
      retryAfterSeconds:
        error instanceof RateLimiterRes
          ? Math.max(1, Math.ceil(error.msBeforeNext / 1000))
          : DURATION_SECONDS,
      points: POINTS,
      durationSeconds: DURATION_SECONDS,
    };
  }
}
