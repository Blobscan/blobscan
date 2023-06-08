import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  timeSeriesProcedure,
} from "../trpc";

const STATS_PATH = "/stats";

export const statsRouter = createTRPCRouter({
  getBlockOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/block/overall`,
        tags: ["stats", "block"],
        summary: "Get block overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ total: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallBlockStats = await ctx.prisma.blockOverallStats.findUnique({
        where: { id: 1 },
      });

      if (!overallBlockStats) {
        return {
          total: 0,
          updatedAt: new Date(),
        };
      }

      return {
        total: overallBlockStats.totalBlocks,
        updatedAt: overallBlockStats.updatedAt,
      };
    }),
  getBlockStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/block`,
        tags: ["stats", "block"],
        summary: "Get block time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalBlocks: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.blockDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalBlocks: true,
        },
        where: {
          day: { gte: timeFrame.initial },
        },
      });
    }),
  getTransactionOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/transaction/overall`,
        tags: ["stats", "transaction"],
        summary: "Get transaction overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ total: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallTransactionStats =
        await ctx.prisma.transactionOverallStats.findUnique({
          where: { id: 1 },
        });

      if (!overallTransactionStats) {
        return {
          total: 0,
          updatedAt: new Date(),
        };
      }

      return {
        total: overallTransactionStats.totalTransactions,
        updatedAt: overallTransactionStats.updatedAt,
      };
    }),
  getTransactionStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/transaction`,
        tags: ["stats", "transaction"],
        summary: "Get transaction time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalTransactions: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.transactionDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalTransactions: true,
        },
        where: {
          day: { lte: timeFrame.final, gte: timeFrame.initial },
        },
      });
    }),
  getBlobOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/blob/overall`,
        tags: ["stats", "blob"],
        summary: "Get blob overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ totalBlobs: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallBlobStats = await ctx.prisma.blobOverallStats.findUnique({
        where: { id: 1 },
      });

      if (!overallBlobStats) {
        return {
          totalBlobs: 0,
          updatedAt: new Date(),
        };
      }

      return {
        totalBlobs: overallBlobStats.totalBlobs,
        updatedAt: overallBlobStats.updatedAt,
      };
    }),
  getBlobStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/blob`,
        tags: ["stats", "blob"],
        summary: "Get blob time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalBlobs: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.blobDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalBlobs: true,
        },
        where: {
          day: { lte: timeFrame.final, gte: timeFrame.initial },
        },
      });
    }),
});
