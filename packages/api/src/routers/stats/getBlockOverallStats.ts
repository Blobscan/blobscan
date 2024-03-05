import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { BLOCK_BASE_PATH } from "./common";
import {
  getBlockOverallStatsInputSchema,
  getBlockOverallStatsOutputSchema,
} from "./getBlockOverallStats.schema";

export const getBlockOverallStatsQuery = function (
  prisma: TRPCContext["prisma"]
) {
  return prisma.blockOverallStats
    .findUnique({
      where: { id: 1 },
    })
    .then((stats) =>
      stats
        ? {
            ...stats,
            totalBlobGasUsed: stats.totalBlobGasUsed.toFixed(),
            totalBlobAsCalldataGasUsed:
              stats.totalBlobAsCalldataGasUsed.toFixed(),
            totalBlobFee: stats.totalBlobFee.toFixed(),
            totalBlobAsCalldataFee: stats.totalBlobAsCalldataFee.toFixed(),
          }
        : {
            totalBlocks: 0,
            totalBlobGasUsed: "0",
            totalBlobAsCalldataGasUsed: "0",
            totalBlobFee: "0",
            totalBlobAsCalldataFee: "0",
            avgBlobFee: 0,
            avgBlobAsCalldataFee: 0,
            avgBlobGasPrice: 0,
            updatedAt: new Date(),
          }
    );
};

export const getBlockOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${BLOCK_BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves blocks overall stats.",
    },
  })
  .input(getBlockOverallStatsInputSchema)
  .output(getBlockOverallStatsOutputSchema)
  .query(async ({ ctx }) => getBlockOverallStatsQuery(ctx.prisma));
