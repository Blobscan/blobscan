import { Redis } from "ioredis";

import { logger } from "@blobscan/logger";

export function createRedisConnection(scope: string, uri: string) {
  const connection = new Redis(uri, {
    maxRetriesPerRequest: null,
  });

  connection.on("error", (err) => {
    logger.error(`${scope} redis error: ${err}`);
  });

  return connection;
}
