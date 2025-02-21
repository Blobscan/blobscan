import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { rollupSchema } from "../../utils";

const inputSchema = withTimeFrameSchema;

export const outputSchema = z.object({
  days: z.array(z.string()),
  blobsPerRollup: z.array(z.record(rollupSchema, z.number())),
});

type OutputSchema = z.infer<typeof outputSchema>;

export const getRollupDailyStats = publicProcedure
  .input(inputSchema)
  .use(withTimeFrame)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, timeFrame } }) => {
    const stats = await prisma.dailyStats.groupBy({
      by: ["day", "rollup"],
      _sum: {
        totalBlobs: true,
      },
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
        ],
      },
      orderBy: {
        day: "asc",
      },
    });

    const uniqueDays = Array.from(
      new Set(stats.map((item) => item.day.toISOString()))
    );

    const formattedStats: OutputSchema = {
      days: uniqueDays,
      blobsPerRollup: uniqueDays.map((day) => {
        const blobsPerRollup: { [key: string]: number } = {};

        stats
          .filter((item) => item.day.toISOString() === day && item.rollup)
          .forEach((item) => {
            const lowercaseRollup = item.rollup?.toLowerCase() ?? "";
            if (lowercaseRollup) {
              blobsPerRollup[lowercaseRollup] =
                (blobsPerRollup[lowercaseRollup] ?? 0) +
                (item._sum.totalBlobs ?? 0);
            }
          });

        return blobsPerRollup;
      }),
    };

    return formattedStats;
  });
