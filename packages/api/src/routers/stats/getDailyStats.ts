import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import {
  categorySchema,
  rollupSchema,
  serializeCategory,
  serializeDate,
  serializeRollup,
} from "../../utils";
import { timeSchema } from "../../utils/time-schema";
import { statsSchema } from "./common";

const inputSchema = timeSchema;
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
  .query(async ({ ctx: { prisma }, input: { timeFrame } }) => {
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        AND: [
          {
            day: {
              gte: timeFrame,
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
      orderBy: [{ day: "desc" }, { category: "desc" }, { rollup: "desc" }],
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
