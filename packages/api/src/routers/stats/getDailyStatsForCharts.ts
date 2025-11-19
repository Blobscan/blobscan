import { z } from "@blobscan/zod";

import { withSortFilterSchema } from "../../middlewares/withFilters";
import {
  withAllStatFiltersSchema,
  withStatFilters,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { cacheChartQuery } from "../../utils/cache";

// Define only the essential fields needed for chart rendering
const chartFieldsSchema = z.array(
  z.enum([
    "totalBlobs",
    "totalBlobSize",
    "totalBlobUsageSize",
    "totalBlocks",
    "totalBlobGasUsed",
    "avgBlobGasPrice",
    "totalBlobFee",
    "avgBlobFee",
    "avgMaxBlobGasFee",
    "avgBlobUsageSize",
    "totalTransactions",
    "totalUniqueReceivers",
    "totalUniqueSenders",
    "totalBlobAsCalldataGasUsed",
  ])
);

const inputSchema = withAllStatFiltersSchema
  .merge(withSortFilterSchema)
  .extend({
    fields: chartFieldsSchema.optional(),
  });

// Minimal output schema - only day, category, rollup + requested fields
export const outputSchema = z
  .object({
    day: z.date(),
    category: z.string().nullable(),
    rollup: z.string().nullable(),
  })
  .passthrough()
  .array()
  .transform(normalize);

export const getDailyStatsForCharts = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .use(withStatFilters)
  .query(
    cacheChartQuery(
      async ({ ctx: { prisma, statFilters }, input }) => {
        // Build select object with only requested fields
        const select = input.fields
          ? {
              day: true,
              category: true,
              rollup: true,
              ...input.fields.reduce(
                (acc, field) => ({ ...acc, [field]: true }),
                {}
              ),
            }
          : statFilters.select;

        const dailyStats = await prisma.dailyStats.findMany({
          select,
          where: statFilters.where,
          orderBy: [
            {
              day: input.sort,
            },
            {
              category: "asc",
            },
            {
              rollup: "asc",
            },
          ],
        });

        return dailyStats;
      },
      {
        queryName: "getDailyStatsForCharts",
        ttl: "daily",
      }
    )
  );
