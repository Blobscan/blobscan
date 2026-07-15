import type { NextApiRequest } from "next";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { env } from "./env";
import { redis } from "./redis";

const ratelimit = new RateLimiterRedis({
  storeClient: redis,
  points: 2,
  duration: 10,
});

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

export async function rateLimited(request: NextApiRequest): Promise<boolean> {
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
  } catch {
    return true;
  }
}
