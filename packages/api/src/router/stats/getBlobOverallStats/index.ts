import type { TRPCContext } from "../../../context";
import { publicProcedure } from "../../../procedures";
import { BASE_PATH } from "../common";
import {
  getBlobOverallStatsInputSchema,
  getBlobOverallStatsOutputSchema,
} from "./schema";

export function getBlobOverallStatsQuery(prisma: TRPCContext["prisma"]) {
  return prisma.blobOverallStats
    .findUnique({
      where: { id: 1 },
    })
    .then(
      (stats) =>
        stats ?? {
          avgBlobSize: 0,
          totalBlobs: 0,
          totalBlobSize: BigInt(0),
          totalUniqueBlobs: 0,
          updatedAt: new Date(),
        }
    );
}

export const getBlobOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BASE_PATH}/overall`,
      tags: ["stats", "blob"],
      summary: "Get blob overall stats",
    },
  })
  .input(getBlobOverallStatsInputSchema)
  .output(getBlobOverallStatsOutputSchema)
  .query(({ ctx }) => getBlobOverallStatsQuery(ctx.prisma));
