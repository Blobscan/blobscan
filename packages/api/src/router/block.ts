import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { DEFAULT_LIMIT } from "../constants";
import { createTRPCRouter, publicProcedure } from "../trpc";

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  id: false,
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
});

const fullBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  ...blockSelect,
  transactions: {
    select: {
      hash: true,
      blobs: {
        select: {
          hash: true,
        },
      },
    },
  },
});

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      const take = input.limit ?? DEFAULT_LIMIT;

      return ctx.prisma.block.findMany({
        select: fullBlockSelect,
        orderBy: { number: "desc" },
        take,
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

      const block = await ctx.prisma.block.findFirst({
        select: fullBlockSelect,
        where: {
          hash,
        },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with hash '${hash}'`,
        });
      }

      return block;
    }),
  getByBlockNumber: publicProcedure
    .input(
      z.object({
        number: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { number } = input;

      const block = await ctx.prisma.block.findUnique({
        select: fullBlockSelect,
        where: {
          number,
        },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with number '${number}'`,
        });
      }

      return block;
    }),
});
