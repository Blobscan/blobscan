import { OverallStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { BLOB_BASE_PATH } from "./helpers";

export const inputSchema = z.void();

const responseBlobOverallStatsSchema = OverallStatsModel.pick({
  totalBlobs: true,
  totalUniqueBlobs: true,
  totalBlobSize: true,
  updatedAt: true,
});

export const outputSchema = responseBlobOverallStatsSchema.transform(normalize);

export const getBlobOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOB_BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves blobs overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma } }) => {
    const stats = await prisma.overallStats.findMany({
      select: {
        totalBlobs: true,
        totalUniqueBlobs: true,
        totalBlobSize: true,
        updatedAt: true,
      },
      where: {
        category: null,
        rollup: null,
      },
    });

    const allStats = stats[0];

    if (!allStats) {
      return {
        totalBlobs: 0,
        totalUniqueBlobs: 0,
        totalBlobSize: BigInt(0),
        updatedAt: new Date(),
      };
    }

    return {
      totalBlobs: allStats.totalBlobs,
      totalUniqueBlobs: allStats.totalUniqueBlobs,
      totalBlobSize: allStats.totalBlobSize,
      updatedAt: allStats.updatedAt,
    };
  });
