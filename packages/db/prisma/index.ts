import { PrismaClient } from "@prisma/client";

import { baseExtension, statsExtension } from "./extensions";

export type { BlockNumberRange } from "./extensions";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma_ =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const prisma = prisma_.$extends(baseExtension).$extends(statsExtension);

export type BlobscanPrismaClient = typeof prisma;

export * from "./utils/dates";

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma_;
