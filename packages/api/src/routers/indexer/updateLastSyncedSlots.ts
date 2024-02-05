import { TRPCError } from "@trpc/server";

import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import {
  updateLastSyncedSlotsInputSchema,
  updateLastSyncedSlotsOutputSchema,
} from "./updateLastSyncedSlots.schema";

export const updateLastSyncedSlots = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/slot`,
      tags: ["indexer"],
      summary: "Update the latest processed slot in the database",
      protect: true,
    },
  })
  .input(updateLastSyncedSlotsInputSchema)
  .output(updateLastSyncedSlotsOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const lastLowerSyncedSlot = input.lastLowerSyncedSlot;
    const lastUpperSyncedSlot = input.lastUpperSyncedSlot;

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
      },
      create: {
        id: 1,
        lastFinalizedBlock: 0,
        lastLowerSyncedSlot,
        lastUpperSyncedSlot,
      },
    });
  });
