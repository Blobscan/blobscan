import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { BLOB_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

const outputSchema = z.object({
  days: z.array(z.string()),
  totalBlobs: z.array(z.number()),
  totalUniqueBlobs: z.array(z.number()),
  totalBlobSizes: z.array(z.number()),
});

type OutputSchema = z.infer<typeof outputSchema>;

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
        stats.reduce<OutputSchema>(
          (transformedStats, currStats) => {
            transformedStats.days.push(currStats.day.toISOString());
            transformedStats.totalBlobs.push(currStats.totalBlobs);
            transformedStats.totalUniqueBlobs.push(currStats.totalUniqueBlobs);
            transformedStats.totalBlobSizes.push(
              Number(currStats.totalBlobSize)
            );

            return transformedStats;
          },
          {
            days: [],
            totalBlobs: [],
            totalUniqueBlobs: [],
            totalBlobSizes: [],
          }
        )
      )
  );
