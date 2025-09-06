import { PrismaClient } from "@prisma/client";

import { logger } from "@blobscan/logger";

import { baseExtension, statsExtension } from "./extensions";

export function getPrisma() {
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
  };

  let prisma_ = globalForPrisma.prisma;

  if (!prisma_) {
    const p = new PrismaClient({
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

    // eslint-disable-next-line turbo/no-undeclared-env-vars
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

  return prisma_.$extends(baseExtension).$extends(statsExtension);
}

export type BlobscanPrismaClient = ReturnType<typeof getPrisma>;
