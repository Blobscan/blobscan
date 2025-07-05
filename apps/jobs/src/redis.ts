import { Redis } from "ioredis";

export function createRedis(uri: string) {
  return new Redis(uri, {
    maxRetriesPerRequest: null,
  });
}
