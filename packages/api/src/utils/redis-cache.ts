import { Redis } from "ioredis";
import { env } from "@blobscan/env";
import { initTRPC } from "@trpc/server";

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton)
 */
export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URI);
  }
  return redisClient;
};

/**
 * Cache middleware for tRPC procedures
 * @param keyPrefix Prefix for the cache key
 * @param ttlSeconds Time to live in seconds
 */
export const createRedisCacheMiddleware = (keyPrefix: string, ttlSeconds = 60 * 5) => {
  const t = initTRPC.context().create();
  
  return t.middleware(async ({ path, input, next }) => {
    try {
      const redis = getRedisClient();
      
      // Create a cache key based on the procedure path and input
      const cacheKey = `${keyPrefix}:${path}:${JSON.stringify(input)}`;
      
      // Try to get data from cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      
      // If not in cache, execute the procedure
      const result = await next();
      
      // Store the result in cache
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        ttlSeconds
      );
      
      return result;
    } catch (error) {
      // If there's any error with Redis, just continue with the procedure
      console.error('Redis cache error:', error);
      return next();
    }
  });
};
