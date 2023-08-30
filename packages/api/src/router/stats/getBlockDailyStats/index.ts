import { timeFrameProcedure } from "../../../middlewares/withTimeFrame";
import { BLOCK_BASE_PATH } from "../common";
import type { GetBlockDailyStatsOutputSchema } from "./schema";
import { getBlockDailyStatsOutputSchema } from "./schema";

export const getBlockDailyStats = timeFrameProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOCK_BASE_PATH}/overall`,
      tags: ["stats", "block"],
      summary: "Get block time series stats",
    },
  })
  .output(getBlockDailyStatsOutputSchema)
  .query(({ ctx: { prisma, timeFrame } }) =>
    prisma.blockDailyStats
      .findMany({
        where: {
          day: {
            gte: timeFrame.initial.toDate(),
            lte: timeFrame.final.toDate(),
          },
        },
        orderBy: { day: "asc" },
      })
      .then((stats) =>
        stats.reduce<GetBlockDailyStatsOutputSchema>(
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
            transformedStats.days.push(day.toISOString());
            transformedStats.totalBlocks.push(totalBlocks);
            transformedStats.totalBlobGasUsed.push(Number(totalBlobGasUsed));
            transformedStats.totalBlobAsCalldataGasUsed.push(
              totalBlobAsCalldataGasUsed
            );
            transformedStats.totalBlobFees.push(totalBlobFee);
            transformedStats.totalBlobAsCalldataFees.push(
              totalBlobAsCalldataFee
            );
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
        )
      )
  );
