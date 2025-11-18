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

    try {
      const cacheKey = `trpc:query:${queryName}:${superjson.stringify({
        input,
      })}`;

      const [res, getDuration] = await perfOperation(() => redis.get(cacheKey));

      if (res) {
        const payloadSizeBytes = Buffer.byteLength(res, "utf8");
        const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);
        logger.debug(
          `Cache hit (${getDuration}ms) [payloadSize=${payloadSizeKB}KB] key=${cacheKey}`
        );
        // logger.debug(`Cache payload: ${res}`);

        return superjson.parse(res) as Out;
      }

      logger.debug(`Cache miss (${getDuration}ms) key=${cacheKey}`);

      const [data, resolverDuration] = await perfOperation(() =>
        resolver({ ctx, input })
      );

      const resolvedTtl = resolveTTL(ttl);

      const serialized = superjson.stringify(data);
      const payloadSizeBytes = Buffer.byteLength(serialized, "utf8");
      const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);

      const [_, setDuration] = await perfOperation(() =>
        redis.set(cacheKey, serialized, "EX", resolvedTtl)
      );

      logger.debug(
        `Cache set (${
          resolverDuration + setDuration
        }ms) [dataFetching=${resolverDuration}ms | redisSet=${setDuration}ms | payloadSize=${payloadSizeKB}KB] key=${cacheKey} ttl=${ttl}${
          typeof ttl === "number" ? "s" : ""
        }`
      );

      return data;
    } catch (error) {
      logger.warn(
        `Redis cache error for ${queryName}, falling back to direct query:`,
        error
      );
      return resolver({ ctx, input });
    }
  };
}

// CSV serialization helpers for chart data
function serializeChartDataToCSV(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return "";

  // Get all unique keys from the data
  const keys = Array.from(
    new Set(data.flatMap((row) => Object.keys(row)))
  ).sort();

  // Create header row
  const header = keys.join(",");

  // Create data rows
  const rows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return "";
        if (value instanceof Date) return value.toISOString();
        // Handle BigInt
        if (typeof value === "bigint") return value.toString();
        // Handle Prisma Decimal objects
        if (value && typeof value === "object" && "toString" in value) {
          return String(value);
        }
        if (typeof value === "string" && value.includes(","))
          return `"${value}"`;
        return String(value);
      })
      .join(",")
  );

  return `${header}\n${rows.join("\n")}`;
}

function deserializeCSVToChartData(
  csv: string
): Array<Record<string, unknown>> {
  if (!csv) return [];

  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  const keys = lines[0]!.split(",");
  const data: Array<Record<string, unknown>> = [];

  // Fields that should be treated as Decimal (kept as strings for precision)
  const decimalFields = new Set([
    "totalBlobAsCalldataFee",
    "totalBlobAsCalldataGasUsed",
    "totalBlobAsCalldataMaxFees",
    "totalBlobGasPrice",
    "totalBlobFee",
    "totalBlobGasUsed",
    "totalBlobMaxFees",
    "totalBlobMaxGasFees",
  ]);

  // Fields that should be BigInt
  const bigIntFields = new Set(["totalBlobSize"]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = line.split(",");
    const row: Record<string, unknown> = {};

    keys.forEach((key, index) => {
      const value = values[index];
      if (!value || value === "") {
        row[key] = null;
      } else if (key === "day" || key === "periodStart") {
        row[key] = new Date(value);
      } else if (key === "category" || key === "rollup") {
        row[key] = value === "null" ? null : value;
      } else if (decimalFields.has(key)) {
        // Keep Decimal values as strings for precision
        row[key] = value;
      } else if (bigIntFields.has(key)) {
        // Convert to BigInt
        row[key] = BigInt(value);
      } else if (!isNaN(Number(value))) {
        // Parse other numbers
        row[key] = value.includes(".") ? parseFloat(value) : parseInt(value);
      } else {
        row[key] = value.replace(/^"|"$/g, ""); // Remove quotes
      }
    });

    data.push(row);
  }

  return data;
}

// Optimized cache function for chart data using CSV serialization
export function cacheChartQuery<In, Out, Ctx extends TRPCContext = TRPCContext>(
  resolver: Resolver<Ctx, In, Out>,
  { queryName, ttl }: { queryName: string; ttl: CacheTTL }
): Resolver<Ctx, In, Out> {
  return async ({ ctx, input }) => {
    const { redis } = ctx;

    if (!redis) return resolver({ ctx, input });

    try {
      const cacheKey = `trpc:chart:${queryName}:${superjson.stringify({
        input,
      })}`;

      const [res, getDuration] = await perfOperation(() => redis.get(cacheKey));

      if (res) {
        const payloadSizeBytes = Buffer.byteLength(res, "utf8");
        const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);
        logger.debug(
          `Cache hit [CSV] (${getDuration}ms) [payloadSize=${payloadSizeKB}KB] key=${cacheKey}`
        );
        // logger.debug(`Cache payload [CSV]: ${res}`);

        return deserializeCSVToChartData(res) as Out;
      }

      logger.debug(`Cache miss [CSV] (${getDuration}ms) key=${cacheKey}`);

      const [data, resolverDuration] = await perfOperation(() =>
        resolver({ ctx, input })
      );

      const resolvedTtl = resolveTTL(ttl);

      // Serialize as CSV instead of JSON
      const serialized = serializeChartDataToCSV(
        data as Array<Record<string, unknown>>
      );
      const payloadSizeBytes = Buffer.byteLength(serialized, "utf8");
      const payloadSizeKB = (payloadSizeBytes / 1024).toFixed(2);

      const [_, setDuration] = await perfOperation(() =>
        redis.set(cacheKey, serialized, "EX", resolvedTtl)
      );

      logger.debug(
        `Cache set [CSV] (${
          resolverDuration + setDuration
        }ms) [dataFetching=${resolverDuration}ms | redisSet=${setDuration}ms | payloadSize=${payloadSizeKB}KB] key=${cacheKey} ttl=${ttl}${
          typeof ttl === "number" ? "s" : ""
        }`
      );

      return data;
    } catch (error) {
      logger.warn(
        `Redis cache error [CSV] for ${queryName}, falling back to direct query:`,
        error
      );
      return resolver({ ctx, input });
    }
  };
}
