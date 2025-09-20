import IORedis from "ioredis";

import { env } from "@blobscan/env";

export const redis = new IORedis(env.REDIS_URI);
