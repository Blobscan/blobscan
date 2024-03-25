import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { BLOB_BASE_PATH } from "./common";

export const inputSchema = z.void();

export const outputSchema = z.object({
  totalBlobs: z.number(),
  totalUniqueBlobs: z.number(),
  totalBlobSize: z.string(),
  avgBlobSize: z.number(),
  updatedAt: z.date(),
});

export function getBlobOverallStatsQuery(prisma: TRPCContext["prisma"]) {
  return prisma.blobOverallStats
    .findUnique({
      where: { id: 1 },
    })
    .then((stats) =>
      stats
        ? {
            ...stats,
            totalBlobSize: stats.totalBlobSize.toString(),
          }
        : {
            avgBlobSize: 0,
            totalBlobs: 0,
            totalBlobSize: "0",
            totalUniqueBlobs: 0,
            updatedAt: new Date(),
          }
    );
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
