import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { serialize } from "../../utils";
import { BLOCK_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

const blockDailyStatsResponse = z.object({
  days: DailyStatsModel.shape.day.array(),
  totalBlocks: DailyStatsModel.shape.totalBlocks.array(),
  totalBlobGasUsed: DailyStatsModel.shape.totalBlobGasUsed.array(),
  totalBlobAsCalldataGasUsed:
    DailyStatsModel.shape.totalBlobAsCalldataGasUsed.array(),
  totalBlobFees: DailyStatsModel.shape.totalBlobFee.array(),
  totalBlobAsCalldataFees: DailyStatsModel.shape.totalBlobAsCalldataFee.array(),
  avgBlobFees: DailyStatsModel.shape.avgBlobFee.array(),
  avgBlobAsCalldataFees: DailyStatsModel.shape.avgBlobAsCalldataFee.array(),
  avgBlobGasPrices: DailyStatsModel.shape.avgBlobGasPrice.array(),
});

export const outputSchema = blockDailyStatsResponse.transform(serialize);

type OutputSchema = z.input<typeof outputSchema>;

export const getBlockDailyStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOCK_BASE_PATH}`,
      tags: ["stats"],
      summary: "retrieves blocks time series stats.",
    },
  })
  .input(inputSchema)
  .use(withTimeFrame)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, timeFrame } }) => {
    const stats = await prisma.dailyStats.findMany({
      where: {
        AND: [
          {
            day: {
              gte: timeFrame.initial.toDate(),
              lte: timeFrame.final.toDate(),
            },
          },
          {
            category: null,
          },
          {
            rollup: null,
          },
        ],
      },
      orderBy: { day: "asc" },
    });

    return stats.reduce<OutputSchema>(
      (
        transformedStats,
        {
          day,
          totalBlocks,
          totalBlobGasUsed,
          totalBlobAsCalldataGasUsed,
          totalBlobFee,
          totalBlobAsCalldataFee,
          avgBlobFee,
          avgBlobAsCalldataFee,
          avgBlobGasPrice,
        }
      ) => {
        transformedStats.days.push(day);
        transformedStats.totalBlocks.push(totalBlocks);
        transformedStats.totalBlobGasUsed.push(totalBlobGasUsed);
        transformedStats.totalBlobAsCalldataGasUsed.push(
          totalBlobAsCalldataGasUsed
        );
        transformedStats.totalBlobFees.push(totalBlobFee);
        transformedStats.totalBlobAsCalldataFees.push(totalBlobAsCalldataFee);
        transformedStats.avgBlobFees.push(avgBlobFee);
        transformedStats.avgBlobAsCalldataFees.push(avgBlobAsCalldataFee);
        transformedStats.avgBlobGasPrices.push(avgBlobGasPrice);

        return transformedStats;
      },
      {
        days: [],
        totalBlocks: [],
        totalBlobGasUsed: [],
        totalBlobAsCalldataGasUsed: [],
        totalBlobFees: [],
        totalBlobAsCalldataFees: [],
        avgBlobFees: [],
        avgBlobAsCalldataFees: [],
        avgBlobGasPrices: [],
      }
    );
  });
