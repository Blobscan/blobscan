import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { timeSchema } from "../../utils/time-schema";
import { BLOB_BASE_PATH } from "./common";

const inputSchema = timeSchema;

export const outputSchema = z.object({
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
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { timeFrame } }) => {
    const stats = await prisma.dailyStats.findMany({
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
      orderBy: { day: "asc" },
    });

    return stats.reduce<OutputSchema>(
      (transformedStats, currStats) => {
        transformedStats.days.push(currStats.day.toISOString());
        transformedStats.totalBlobs.push(currStats.totalBlobs);
        transformedStats.totalUniqueBlobs.push(currStats.totalUniqueBlobs);
        transformedStats.totalBlobSizes.push(Number(currStats.totalBlobSize));

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
