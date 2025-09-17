import type { NextApiRequest } from "next";
import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { env } from "../../../env.mjs";

const redis = new Redis(env.REDIS_URI);

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

const ratelimit = new RateLimiterRedis({
  storeClient: redis,
  points: 2,
  duration: 10,
});

export async function rateLimited(request: NextApiRequest): Promise<boolean> {
  if (redis.status !== "ready") {
    console.warn("Skipping rate limit check, Redis is not available");
    return false;
  }

  let ip = request.headers["x-forwarded-for"] || request.socket.remoteAddress;

  if (Array.isArray(ip)) {
    ip = ip[0];
  }

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
