import { DailyStatsModel } from "@blobscan/db/prisma/zod";

import { withSortFilterSchema } from "../../middlewares/withFilters";
import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";

const inputSchema = withTimeFrameSchema.merge(withSortFilterSchema);
const outputSchema = DailyStatsModel.omit({
  id: true,
})
  .array()
  .transform(normalize);

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
