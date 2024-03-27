import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { BLOCK_BASE_PATH } from "./common";

const inputSchema = z.void();
export const outputSchema = z.object({
  totalBlocks: z.number(),
  totalBlobGasUsed: z.string(),
  totalBlobAsCalldataGasUsed: z.string(),
  totalBlobFee: z.string(),
  totalBlobAsCalldataFee: z.string(),
  avgBlobFee: z.number(),
  avgBlobAsCalldataFee: z.number(),
  avgBlobGasPrice: z.number(),
  updatedAt: z.date(),
});

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
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx }) => getBlockOverallStatsQuery(ctx.prisma));
