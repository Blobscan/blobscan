import { PrismaClient } from "@prisma/client";

import { StatsAggregator } from "./StatsAggregator";

export * from "@prisma/client";

export * from "./utils/dates";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
export const statsAggregator = new StatsAggregator(prisma);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
