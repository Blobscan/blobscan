import { DailyStatsModel } from "@blobscan/db/prisma/zod";

import { withSortFilterSchema } from "../../middlewares/withFilters";
import {
  withAllStatFiltersSchema,
  withStatFilters,
} from "../../middlewares/withStatFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";

const inputSchema = withAllStatFiltersSchema.merge(withSortFilterSchema);

const outputSchema = DailyStatsModel.omit({
  id: true,
})
  .partial()
  .required({
    day: true,
    category: true,
    rollup: true,
  })
  .array()
  .transform(normalize);

export const getDailyStats = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .use(withStatFilters)
  .query(async ({ ctx: { prisma, statFilters }, input }) => {
    const dailyStats = await prisma.dailyStats.findMany({
      select: statFilters.select,
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
  });
