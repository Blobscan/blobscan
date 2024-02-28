import { Redis } from "ioredis";

import { logger } from "@blobscan/logger";
import type { LoggerLevel } from "@blobscan/logger";

export function createRedisConnection(uri: string) {
  return new Redis(uri, {
    maxRetriesPerRequest: null,
  });
}

export function log(
  level: LoggerLevel,
  message: string,
  { updater }: { updater?: string } = {}
) {
  logger[level](
    `[Stats Syncer]${updater ? ` Updater ${updater}` : ""}: ${message}`
  );
}
