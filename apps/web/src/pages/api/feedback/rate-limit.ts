import type { NextApiRequest } from "next";
import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { env } from "@blobscan/env";

const redis = new Redis(env.REDIS_URI);

const ratelimit = new RateLimiterRedis({
  storeClient: redis,
  points: 2,
  duration: 10,
});

export async function rateLimited(request: NextApiRequest): Promise<boolean> {
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
