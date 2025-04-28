import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Redis } from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";

import { env } from "@blobscan/env";

const redis = new Redis(env.REDIS_URI);

const ratelimit = new RateLimiterRedis({
  storeClient: redis,
  points: 2,
  duration: 10,
});

// Routes to rate limit
export const config = {
  matcher: "/api/feedback",
};

export default async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";

  try {
    await ratelimit.consume(ip);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
