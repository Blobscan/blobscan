import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { BLOCK_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

const outputSchema = z.object({
  days: z.array(z.string()),
  totalBlocks: z.array(z.number()),
  totalBlobGasUsed: z.array(z.string()),
  totalBlobAsCalldataGasUsed: z.array(z.string()),
  totalBlobFees: z.array(z.string()),
  totalBlobAsCalldataFees: z.array(z.string()),
  avgBlobFees: z.array(z.number()),
  avgBlobAsCalldataFees: z.array(z.number()),
  avgBlobGasPrices: z.array(z.number()),
});

type OutputSchema = z.infer<typeof outputSchema>;

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
        stats.reduce<OutputSchema>(
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
            transformedStats.totalBlobGasUsed.push(totalBlobGasUsed.toFixed());
            transformedStats.totalBlobAsCalldataGasUsed.push(
              totalBlobAsCalldataGasUsed.toFixed()
            );
            transformedStats.totalBlobFees.push(totalBlobFee.toFixed());
            transformedStats.totalBlobAsCalldataFees.push(
              totalBlobAsCalldataFee.toFixed()
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
