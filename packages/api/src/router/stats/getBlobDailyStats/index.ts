import { timeFrameProcedure } from "../../../middlewares/withTimeFrame";
import { BLOB_BASE_PATH } from "../common";
import type { GetBlobDailyStatsOutputSchema } from "./schema";
import { getBlobDailyStatsOutputSchema } from "./schema";

export const getBlobDailyStats = timeFrameProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOB_BASE_PATH}/daily`,
      tags: ["stats", "blob"],
      summary: "Get blob time series stats",
    },
  })
  .output(getBlobDailyStatsOutputSchema)
  .query(({ ctx: { prisma, timeFrame } }) =>
    prisma.blobDailyStats
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
        stats.reduce<GetBlobDailyStatsOutputSchema>(
          (transformedStats, currStats) => {
            transformedStats.days.push(currStats.day.toISOString());
            transformedStats.totalBlobs.push(currStats.totalBlobs);
            transformedStats.totalUniqueBlobs.push(currStats.totalUniqueBlobs);
            transformedStats.totalBlobSizes.push(
              Number(currStats.totalBlobSize)
            );
            transformedStats.avgBlobSizes.push(currStats.avgBlobSize);

            return transformedStats;
          },
          {
            days: [],
            totalBlobs: [],
            totalUniqueBlobs: [],
            totalBlobSizes: [],
            avgBlobSizes: [],
          }
        )
      )
  );
