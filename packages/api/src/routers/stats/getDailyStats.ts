import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import {
  nullishCategorySchema,
  nullishRollupSchema,
  toISODateSchema,
  stringifyDecimalSchema,
} from "@blobscan/db/prisma/zod-utils";

import { withSortFilterSchema } from "../../middlewares/withFilters";
import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";

const serializedDailyStatsSchema = DailyStatsModel.omit({
  id: true,
}).transform(
  ({
    day,
    category,
    rollup,
    totalBlobAsCalldataFee,
    totalBlobAsCalldataGasUsed,
    totalBlobAsCalldataMaxFees,
    totalBlobFee,
    totalBlobGasPrice,
    totalBlobGasUsed,
    totalBlobMaxFees,
    totalBlobMaxGasFees,
    totalBlobSize,
    ...restDailyStats
  }) => ({
    ...restDailyStats,
    day: toISODateSchema.parse(day),
    category: nullishCategorySchema.parse(category),
    rollup: nullishRollupSchema.parse(rollup),
    totalBlobAsCalldataFee: stringifyDecimalSchema.parse(
      totalBlobAsCalldataFee
    ),
    totalBlobAsCalldataGasUsed: stringifyDecimalSchema.parse(
      totalBlobAsCalldataGasUsed
    ),
    totalBlobAsCalldataMaxFees: stringifyDecimalSchema.parse(
      totalBlobAsCalldataMaxFees
    ),
    totalBlobFee: stringifyDecimalSchema.parse(totalBlobFee),
    totalBlobGasPrice: stringifyDecimalSchema.parse(totalBlobGasPrice),
    totalBlobGasUsed: stringifyDecimalSchema.parse(totalBlobGasUsed),
    totalBlobMaxFees: stringifyDecimalSchema.parse(totalBlobMaxFees),
    totalBlobMaxGasFees: stringifyDecimalSchema.parse(totalBlobMaxGasFees),
    totalBlobSize: totalBlobSize.toString(),
  })
);

const inputSchema = withTimeFrameSchema.merge(withSortFilterSchema);
const outputSchema = serializedDailyStatsSchema.array();

export const getDailyStats = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .use(withTimeFrame)
  .query(async ({ ctx: { prisma, timeFrame }, input }) => {
    const dailyStats = await prisma.dailyStats.findMany({
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
      orderBy: [
        {
          day: input.sort,
        },
        {
          category: "desc",
        },
        {
          rollup: "desc",
        },
      ],
    });

    return dailyStats;
  });
