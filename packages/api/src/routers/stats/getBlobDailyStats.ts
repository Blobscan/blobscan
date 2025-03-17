import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { serialize } from "../../utils";
import { BLOB_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

const blobDailyStatsResponseSchema = z.object({
  days: DailyStatsModel.shape.day.array(),
  totalBlobs: DailyStatsModel.shape.totalBlobs.array(),
  totalUniqueBlobs: DailyStatsModel.shape.totalUniqueBlobs.array(),
  totalBlobSizes: DailyStatsModel.shape.totalBlobSize.array(),
});

export const outputSchema = blobDailyStatsResponseSchema.transform(serialize);

type OutputSchema = z.input<typeof outputSchema>;

export const getBlobDailyStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOB_BASE_PATH}`,
      tags: ["stats"],
      summary: "retrieves blob time series stats.",
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
      (transformedStats, currStats) => {
        transformedStats.days.push(currStats.day);
        transformedStats.totalBlobs.push(currStats.totalBlobs);
        transformedStats.totalUniqueBlobs.push(currStats.totalUniqueBlobs);
        transformedStats.totalBlobSizes.push(currStats.totalBlobSize);

        return transformedStats;
      },
      {
        days: [],
        totalBlobs: [],
        totalUniqueBlobs: [],
        totalBlobSizes: [],
      }
    );
  });
