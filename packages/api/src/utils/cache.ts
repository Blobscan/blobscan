import dayjs from "@blobscan/dayjs";
import { perfOperation, logger } from "@blobscan/logger";

import type { TRPCContext } from "../context";
import { superjson } from "../superjson";

type Resolver<Ctx, In, Out> = (opts: { ctx: Ctx; input: In }) => Promise<Out>;

export type CacheTTL = number | "daily" | "hourly";

export const TTL_GRACE_PERIOD_SECONDS = 5 * 60; // 5 minutes

export function resolveTTL(ttl: CacheTTL) {
  const currentDate = dayjs().utc();

  switch (ttl) {
    case "daily":
      return currentDate
        .endOf("day")
        .add(TTL_GRACE_PERIOD_SECONDS, "second")
        .diff(currentDate, "second");

    case "hourly":
      return currentDate
        .endOf("hour")
        .add(TTL_GRACE_PERIOD_SECONDS, "second")
        .diff(currentDate, "second");
    default:
      return ttl;
  }
}

export function cacheTRPCQuery<In, Out, Ctx extends TRPCContext = TRPCContext>(
  resolver: Resolver<Ctx, In, Out>,
  { queryName, ttl }: { queryName: string; ttl: CacheTTL }
): Resolver<Ctx, In, Out> {
  return async ({ ctx, input }) => {
    const { redis } = ctx;

    if (!redis) return resolver({ ctx, input });

    const cacheKey = `trpc:query:${queryName}:${superjson.stringify({
      input,
    })}`;

    const [res, getDuration] = await perfOperation(() => redis.get(cacheKey));

    if (res) {
      logger.debug(`Cache hit (${getDuration}ms) key=${cacheKey}`);

      return superjson.parse(res) as Out;
    }

    logger.debug(`Cache miss (${getDuration}ms) key=${cacheKey}`);

    const [data, resolverDuration] = await perfOperation(() =>
      resolver({ ctx, input })
    );

    const resolvedTtl = resolveTTL(ttl);

    const [_, setDuration] = await perfOperation(() =>
      redis.set(cacheKey, superjson.stringify(data), "EX", resolvedTtl)
    );

    logger.debug(
      `Cache set (${
        resolverDuration + setDuration
      }ms) [dataFetching=${resolverDuration}ms | redisSet=${setDuration}ms] key=${cacheKey} ttl=${ttl}${
        typeof ttl === "number" ? "s" : ""
      }`
    );

    return data;
  };
}
