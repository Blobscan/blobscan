import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH } from "../../utils/stats";
import { blobStatsRouter } from "./blob";
import { blockStatsRouter } from "./block";
import { transactionStatsRouter } from "./tx";

export const statsRouter = createTRPCRouter({
  blob: blobStatsRouter,
  block: blockStatsRouter,
  transaction: transactionStatsRouter,
  getAllOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/overall`,
        tags: ["stats", "overall"],
        summary: "Get all overall stats",
      },
    })
    .input(z.void())
    // TODO: Find a better way to do this by trying to convert prisma types to zod types
    .output(
      z.object({
        blob: z
          .object({
            totalBlobs: z.number(),
            totalUniqueBlobs: z.number(),
            totalBlobSize: z.bigint(),
            avgBlobSize: z.number(),
            updatedAt: z.date(),
          })
          .nullable(),
        block: z
          .object({
            totalBlocks: z.number(),
            updatedAt: z.date(),
          })
          .nullable(),
        transaction: z
          .object({
            totalTransactions: z.number(),
            totalUniqueReceivers: z.number(),
            totalUniqueSenders: z.number(),
            updatedAt: z.date(),
          })
          .nullable(),
      }),
    )
    .query(({ ctx: { prisma } }) =>
      Promise.all([
        prisma.blobOverallStats.findUnique({ where: { id: 1 } }),
        prisma.blockOverallStats.findUnique({ where: { id: 1 } }),
        prisma.transactionOverallStats.findUnique({ where: { id: 1 } }),
      ]).then(([blob, block, transaction]) => ({
        blob,
        block,
        transaction,
      })),
    ),
});
