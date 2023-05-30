import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../trpc";
import { PAGINATION_INPUTS, getPaginationParams } from "../utils/pagination";

const blockSelect = Prisma.validator<Prisma.BlockSelect>()({
  id: false,
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
});

export const fullBlockSelect = Prisma.validator<Prisma.BlockSelect>()({
  ...blockSelect,
  transactions: {
    select: {
      hash: true,
      from: true,
      to: true,
      blobs: {
        select: {
          versionedHash: true,
          index: true,
        },
      },
    },
  },
});

export const blockRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        ...PAGINATION_INPUTS,
      }),
    )
    .query(async ({ ctx, input }) => {
      const [blocks, totalBlocks] = await Promise.all([
        ctx.prisma.block.findMany({
          select: fullBlockSelect,
          orderBy: { number: "desc" },
          ...getPaginationParams(input),
        }),
        ctx.prisma.block.count(),
      ]);

      return {
        blocks,
        totalBlocks,
      };
    }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const block = await ctx.prisma.block.findUnique({
        select: fullBlockSelect,
        where: { id },
      });

      if (!block) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${id}'`,
        });
      }

      return block;
    }),
  getByHash: publicProcedure
    .input(
      z.object({
        hash: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { hash } = input;

      const block = await ctx.prisma.block.findUnique({
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
