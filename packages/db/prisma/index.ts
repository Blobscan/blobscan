import { PrismaClient } from "@prisma/client";

import { baseExtension } from "./extensions";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prisma_ =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

export const prisma = prisma_.$extends(baseExtension);

export type BlobscanPrismaClient = typeof prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma_;
