import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH } from "../../utils/stats";
import { blobStatsRouter } from "./blob";
import { blockStatsRouter } from "./block";
import { transactionStatsRouter } from "./transaction";

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
