import { beforeEach, describe, expect, it, vi } from "vitest";

import { redis } from "@blobscan/test";
import type { ZodSchema } from "@blobscan/zod";

import { superjson } from "../../src/superjson";
import { resolveTTL } from "../../src/utils";
import type { CacheTTL } from "../../src/utils";

function createCacheKey(procedureName: string, input: Record<string, unknown>) {
  return `trpc:query:${procedureName}:${superjson.stringify({
    input,
  })}`;
}

export function runTRPCQueryCacheTests<
  In extends Record<string, unknown>,
  Out
>({
  procedureCall,
  procedureInput,
  procedureName,
  outputSchema,
  ttlProvided,
}: {
  procedureName: string;
  procedureInput: In;
  procedureCall: () => Promise<Out>;
  outputSchema?: ZodSchema;
  ttlProvided: CacheTTL;
}) {
  return describe("when caching procedure query", () => {
    const cacheKey = createCacheKey(procedureName, procedureInput);

    beforeEach(async () => {
      await redis.del(cacheKey);
    });

    it("should store result with the correct key", async () => {
      const existsBefore = redis.exists(cacheKey);

      await procedureCall();

      await expect(
        existsBefore,
        "cache key exists before calling procedure"
      ).resolves.toBe(0);
      await expect(
        redis.exists(cacheKey),
        "cache key does not exists after calling procedure"
      ).resolves.toBe(1);
    });

    it("should store result correctly", async () => {
      const cachedResultBefore = await redis.get(cacheKey);

      const result = await procedureCall();

      const cachedResult = await redis.get(cacheKey);

      expect(
        cachedResultBefore,
        "Result was already cache before calling procedure"
      ).toBeNull();
      expect(cachedResult).not.toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parsedCachedRes = superjson.parse(cachedResult!);

      const outputCachedResult =
        outputSchema?.parse(parsedCachedRes) ?? parsedCachedRes;

      expect(result).toEqual(outputCachedResult);
    });

    it("should cache the result with the specified TTL", async () => {
      await procedureCall();

      const ttl = await redis.ttl(cacheKey);

      expect(ttl).toBe(resolveTTL(ttlProvided));
    });

    it("should retrieve result from cache if it exists", async () => {
      await procedureCall();

      const redisGetSpy = vi.spyOn(redis, "get");
      const redisSetSpy = vi.spyOn(redis, "set");

      await procedureCall();

      expect(redisGetSpy).toHaveBeenCalledOnce();
      expect(redisSetSpy).toHaveBeenCalledTimes(0);
    });
  });
}
