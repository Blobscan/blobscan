import { Redis } from "ioredis";

import { env } from "@blobscan/env";

const redis = new Redis(env.REDIS_URI);

redis.on("error", (error) => {
  console.error("Redis error:", error);
});

export { redis };
