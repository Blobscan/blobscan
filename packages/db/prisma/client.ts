import { PrismaClient } from "@prisma/client";

import { logger } from "@blobscan/logger";

import { baseExtension, statsExtension } from "./extensions";

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
        : [{ emit: "event", level: "error" }],
  });

  p.$on("query", (e) => {
    logger.debug(`${e.query}\nParams=${e.params}\nDuration=${e.duration}ms`);
  });

  p.$on("error", (e) => {
    logger.error(e.message);
  });

  p.$on("warn", (e) => {
    logger.warn(e.message);
  });

  prisma_ = p;
}

export const prisma = prisma_.$extends(baseExtension).$extends(statsExtension);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma_;

export type BlobscanPrismaClient = typeof prisma;

export default prisma;
