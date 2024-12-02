import type { OverallStats } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { serializeDecimal } from "../../utils";
import { BASE_PATH, statsSchema } from "./common";

const inputSchema = z.void();

const outputSchema = statsSchema.merge(
  z.object({
    updatedAt: z.string(),
  })
);

export function serializeOverallStats({
  totalBlobSize,
  totalBlobAsCalldataFee,
  totalBlobAsCalldataGasUsed,
  totalBlobFee,
  totalBlobGasUsed,
  updatedAt,
  ...restOverallStats
}: OverallStats) {
  return {
    ...restOverallStats,
    totalBlobSize: totalBlobSize.toString(),
    totalBlobAsCalldataFee: serializeDecimal(totalBlobAsCalldataFee),
    totalBlobAsCalldataGasUsed: serializeDecimal(totalBlobAsCalldataGasUsed),
    totalBlobFee: serializeDecimal(totalBlobFee),
    totalBlobGasUsed: serializeDecimal(totalBlobGasUsed),
    updatedAt: updatedAt.toISOString(),
  };
}
export const getOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves all overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const allOverallStats = await ctx.prisma.overallStats.findMany({
      where: {
        category: null,
        rollup: null,
      },
    });

    const overallStats = allOverallStats[0];

    if (!overallStats) {
      return {
        avgBlobAsCalldataFee: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgMaxBlobGasFee: 0,
        totalBlobs: 0,
        totalBlobSize: "0",
        totalBlocks: 0,
        totalTransactions: 0,
        totalUniqueBlobs: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
        totalBlobAsCalldataFee: "0",
        totalBlobAsCalldataGasUsed: "0",
        totalBlobFee: "0",
        totalBlobGasUsed: "0",
        updatedAt: new Date().toISOString(),
      };
    }

    return serializeOverallStats(overallStats);
  });
