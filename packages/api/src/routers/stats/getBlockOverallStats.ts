import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { decimalToBigInt } from "../../utils";
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
            totalBlobGasUsed: decimalToBigInt(stats.totalBlobGasUsed),
            totalBlobAsCalldataGasUsed: decimalToBigInt(
              stats.totalBlobAsCalldataGasUsed
            ),
            totalBlobFee: decimalToBigInt(stats.totalBlobFee),
            totalBlobAsCalldataFee: decimalToBigInt(
              stats.totalBlobAsCalldataFee
            ),
          }
        : {
            totalBlocks: 0,
            totalBlobGasUsed: BigInt(0),
            totalBlobAsCalldataGasUsed: BigInt(0),
            totalBlobFee: BigInt(0),
            totalBlobAsCalldataFee: BigInt(0),
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
      tags: ["blocks"],
      summary: "Get blocks overall stats",
    },
  })
  .input(getBlockOverallStatsInputSchema)
  .output(getBlockOverallStatsOutputSchema)
  .query(async ({ ctx }) => getBlockOverallStatsQuery(ctx.prisma));
