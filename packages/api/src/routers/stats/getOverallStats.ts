import { Prisma } from "@blobscan/db";
import { OverallStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { serialize } from "../../utils";
import { BASE_PATH } from "./common";

const serializedOverallStatsSchema = OverallStatsModel.omit({
  id: true,
}).transform(serialize);

const inputSchema = z.void();

const outputSchema = serializedOverallStatsSchema;

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
        avgBlobAsCalldataMaxFee: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgBlobMaxFee: 0,
        avgMaxBlobGasFee: 0,
        totalBlobAsCalldataFee: new Prisma.Decimal(0),
        totalBlobAsCalldataGasUsed: new Prisma.Decimal(0),
        totalBlobAsCalldataMaxFees: new Prisma.Decimal(0),
        totalBlobFee: new Prisma.Decimal(0),
        totalBlobGasPrice: new Prisma.Decimal(0),
        totalBlobGasUsed: new Prisma.Decimal(0),
        totalBlobMaxFees: new Prisma.Decimal(0),
        totalBlobMaxGasFees: new Prisma.Decimal(0),
        totalBlobs: 0,
        totalBlobSize: BigInt(0),
        totalBlocks: 0,
        totalTransactions: 0,
        totalUniqueBlobs: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
        updatedAt: new Date(),
        category: null,
        rollup: null,
      } satisfies z.input<typeof outputSchema>;
    }

    return overallStats;
  });
