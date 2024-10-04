import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { BLOB_BASE_PATH } from "./common";

export const inputSchema = z.void();

export const outputSchema = z.object({
  totalBlobs: z.number(),
  totalUniqueBlobs: z.number(),
  totalBlobSize: z.string(),
  updatedAt: z.date(),
});

export async function getBlobOverallStatsQuery(prisma: TRPCContext["prisma"]) {
  const stats = await prisma.blobOverallStats.findMany({
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
      totalBlobSize: "0",
      updatedAt: new Date(),
    };
  }

  return {
    totalBlobs: allStats.totalBlobs,
    totalUniqueBlobs: allStats.totalUniqueBlobs,
    totalBlobSize: allStats.totalBlobSize.toString(),
    updatedAt: allStats.updatedAt,
  };
}

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
  .query(({ ctx }) => getBlobOverallStatsQuery(ctx.prisma));
