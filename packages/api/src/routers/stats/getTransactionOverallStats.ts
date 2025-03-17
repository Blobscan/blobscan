import { OverallStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { serialize } from "../../utils";
import { TRANSACTION_BASE_PATH } from "./common";

export const inputSchema = z.void();

const overallStatsResponse = OverallStatsModel.pick({
  avgMaxBlobGasFee: true,
  totalTransactions: true,
  totalUniqueReceivers: true,
  totalUniqueSenders: true,
  updatedAt: true,
});

export const outputSchema = overallStatsResponse.transform(serialize);

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
