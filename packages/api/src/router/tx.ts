import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { PAGINATION_INPUTS, getPaginationParams } from "../utils/pagination";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  id: false,
  hash: true,
  from: true,
  to: true,
  blockNumber: true,
});

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...transactionSelect,
    block: {
      select: {
        timestamp: true,
      },
    },
    blobs: {
      select: {
        id: false,
        versionedHash: true,
        commitment: true,
        index: true,
      },
    },
  });

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        ...PAGINATION_INPUTS,
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        orderBy: { blockNumber: "desc" },
        ...getPaginationParams(input),
      });
    }),
  getByAddress: publicProcedure
    .input(
      z.object({
        address: z.string(),
        ...PAGINATION_INPUTS,
      }),
    )
    .query(async ({ ctx, input }) => {
      const { address } = input;

      return ctx.prisma.transaction.findMany({
        select: fullTransactionSelect,
        where: {
          OR: [{ from: address }, { to: address }],
        },
        orderBy: { blockNumber: "desc" },
        ...getPaginationParams(input),
      });
    }),
  getByHash: publicProcedure
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { hash } = input;
      const tx = await ctx.prisma.transaction.findUnique({
        select: fullTransactionSelect,
        where: { hash },
      });
      if (!tx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No tx with hash '${hash}'`,
        });
      }

      const { block, ...txBase } = tx;
      return {
        ...txBase,
        timestamp: block.timestamp,
      };
    }),
});
