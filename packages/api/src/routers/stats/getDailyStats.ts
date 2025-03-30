import { z } from "@blobscan/zod";

import { withSortFilterSchema } from "../../middlewares/withFilters";
import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import {
  categorySchema,
  rollupSchema,
  serializeCategory,
  serializeDate,
  serializeRollup,
} from "../../utils";
import { statsSchema } from "./common";

const inputSchema = withTimeFrameSchema.merge(withSortFilterSchema);
const outputSchema = statsSchema
  .merge(
    z.object({
      day: z.string(),
      category: categorySchema.nullable(),
      rollup: rollupSchema.nullable(),
    })
  )
  .array();

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

    return dailyStats.map(
      ({
        day,
        category,
        rollup,
        totalBlobSize,
        totalBlobAsCalldataFee,
        totalBlobAsCalldataGasUsed,
        totalBlobFee,
        totalBlobGasUsed,
        ...restStats
      }) => ({
        ...restStats,
        day: serializeDate(day),
        category: category ? serializeCategory(category) : category,
        rollup: serializeRollup(rollup),
        totalBlobSize: totalBlobSize.toString(),
        totalBlobAsCalldataFee: totalBlobAsCalldataFee.toString(),
        totalBlobAsCalldataGasUsed: totalBlobAsCalldataGasUsed.toString(),
        totalBlobFee: totalBlobFee.toString(),
        totalBlobGasUsed: totalBlobGasUsed.toString(),
      })
    );
  });
