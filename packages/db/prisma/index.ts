import { PrismaPg } from "@prisma/adapter-pg";

import { logger } from "@blobscan/logger";

import type { Prisma } from "./client/client";
import { PrismaClient } from "./client/client";
import type { ExtensionConfig as CustomFieldsExtensionConfig } from "./extensions";
import {
  upsertManyExtension,
  createComputedFieldsExtension,
  helpersExtension,
  metricsExtension,
} from "./extensions";
import { ethUsdPriceExtension } from "./extensions/eth-usd-price";

/**
 * Prisma 7's pg adapter takes a plain pg connection string, so the Prisma-specific
 * `schema`, `connection_limit` and `pool_timeout` URL params are translated here.
 */
function parseDatasourceUrl(datasourceUrl: string) {
  const url = new URL(datasourceUrl);
  const { searchParams } = url;
  const schema = searchParams.get("schema") ?? undefined;
  const connectionLimit = Number(searchParams.get("connection_limit"));
  const poolTimeout = Number(searchParams.get("pool_timeout"));

  searchParams.delete("schema");
  searchParams.delete("connection_limit");
  searchParams.delete("pool_timeout");

  return {
    config: {
      connectionString: url.toString(),
      ...(connectionLimit > 0 ? { max: connectionLimit } : {}),
      // pool_timeout is expressed in seconds
      ...(poolTimeout > 0
        ? { connectionTimeoutMillis: poolTimeout * 1000 }
        : {}),
    },
    schema,
  };
}

export type CreatePrismaClientParams = {
  datasourceUrl?: string;
  log?: Prisma.PrismaClientOptions["log"];
};

export function createPrismaClient({
  datasourceUrl = process.env.DATABASE_URL,
  log,
}: CreatePrismaClientParams = {}): PrismaClient<Prisma.LogLevel> {
  if (!datasourceUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const { config, schema } = parseDatasourceUrl(datasourceUrl);
  const adapter = new PrismaPg(config, { schema });

  return new PrismaClient({ adapter, log }) as PrismaClient<Prisma.LogLevel>;
}

export type GetPrismaParams = {
  customFieldExtension: CustomFieldsExtensionConfig;
  datasourceUrl?: string;
};

export function getPrisma(params?: GetPrismaParams) {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
  };

  let prisma_ = globalForPrisma.prisma;

  if (!prisma_) {
    const p = createPrismaClient({
      datasourceUrl: params?.datasourceUrl,
      log:
        process.env.NODE_ENV === "development"
          ? [
              { emit: "event", level: "query" },
              { emit: "event", level: "error" },
              { emit: "event", level: "warn" },
            ]
          : [
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ],
    });

    if (process.env.MODE !== "test") {
      p.$on("query", (e) => {
        logger.debug(`${e.query}\nDuration=${e.duration}ms`);
      });

      p.$on("error", (e) => {
        logger.error(e.message);
      });

      p.$on("warn", (e) => {
        logger.warn(e.message);
      });
    }

    prisma_ = p;
  }

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma_;

  const customFieldsExtension = createComputedFieldsExtension(
    params?.customFieldExtension
  );

  return prisma_
    .$extends(metricsExtension)
    .$extends(helpersExtension)
    .$extends(customFieldsExtension)
    .$extends(ethUsdPriceExtension)
    .$extends(upsertManyExtension);
}

export type BlobscanPrismaClient = ReturnType<typeof getPrisma>;
