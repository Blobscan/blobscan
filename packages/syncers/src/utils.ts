import { Redis } from "ioredis";

import dayjs from "@blobscan/dayjs";

export function createRedisConnection(uri: string) {
  return new Redis(uri, {
    maxRetriesPerRequest: null,
  });
}

export function formatDate(date: Date | string | dayjs.Dayjs) {
  return dayjs(date).format("YYYY-MM-DD");
}
