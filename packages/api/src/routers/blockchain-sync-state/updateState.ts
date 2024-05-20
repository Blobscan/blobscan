import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { jwtAuthedProcedure } from "../../procedures";
import { BASE_PATH } from "./common";

export const inputSchema = z.object({
  lastLowerSyncedSlot: z.number().optional(),
  lastUpperSyncedSlot: z.number().optional(),
  lastFinalizedBlock: z.number().optional(),
});

export const outputSchema = z.void();

export const updateState = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: BASE_PATH,
      tags: ["indexer"],
      summary: "updates the blockchain sync state.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ ctx, input }) => {
    const lastLowerSyncedSlot = input.lastLowerSyncedSlot;
    const lastUpperSyncedSlot = input.lastUpperSyncedSlot;
    const lastFinalizedBlock = input.lastFinalizedBlock;

    if (
      lastLowerSyncedSlot !== undefined &&
      lastUpperSyncedSlot !== undefined &&
      lastLowerSyncedSlot > lastUpperSyncedSlot
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Last lower synced slot must be less than or equal to last upper synced slot",
      });
    }

    await ctx.prisma.blockchainSyncState.upsert({
      where: { id: 1 },
      update: {
        lastLowerSyncedSlot,
        lastUpperSyncedSlot,
        lastFinalizedBlock,
      },
      create: {
        id: 1,
        lastLowerSyncedSlot:0,
        lastUpperSyncedSlot,
        lastFinalizedBlock,
      },
    });
  });
