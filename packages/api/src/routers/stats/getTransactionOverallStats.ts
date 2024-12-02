import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { TRANSACTION_BASE_PATH } from "./common";

export const inputSchema = z.void();

export const outputSchema = z.object({
  totalTransactions: z.number(),
  totalUniqueReceivers: z.number(),
  totalUniqueSenders: z.number(),
  avgMaxBlobGasFee: z.number(),
  updatedAt: z.date(),
});

export async function getTransactionOverallStatsQuery(
  prisma: TRPCContext["prisma"]
) {
  const overallStats = await prisma.overallStats.findFirst({
    where: {
      category: null,
      rollup: null,
    },
  });

  if (!overallStats) {
    return {
      totalTransactions: 0,
      totalUniqueReceivers: 0,
      totalUniqueSenders: 0,
      avgMaxBlobGasFee: 0,
      updatedAt: new Date(),
    };
  }

  const {
    totalTransactions,
    totalUniqueReceivers,
    totalUniqueSenders,
    avgMaxBlobGasFee,
    updatedAt,
  } = overallStats;

  return {
    totalTransactions,
    totalUniqueReceivers,
    totalUniqueSenders,
    avgMaxBlobGasFee,
    updatedAt,
  };
}

export const getTransactionOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${TRANSACTION_BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves transactions overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma } }) => {
    const overallStats = await prisma.overallStats.findFirst({
      where: {
        category: null,
        rollup: null,
      },
    });

    if (!overallStats) {
      return {
        totalTransactions: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
        avgMaxBlobGasFee: 0,
        updatedAt: new Date(),
      };
    }

    const {
      totalTransactions,
      totalUniqueReceivers,
      totalUniqueSenders,
      avgMaxBlobGasFee,
      updatedAt,
    } = overallStats;

    return {
      totalTransactions,
      totalUniqueReceivers,
      totalUniqueSenders,
      avgMaxBlobGasFee,
      updatedAt,
    };
  });
