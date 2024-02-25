import { TRPCError } from "@trpc/server";

import { jwtAuthedProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import {
  updateStateInputSchema,
  updateStateOutputSchema,
} from "./updateState.schema";

export const updateState = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: BASE_PATH,
      tags: ["indexer"],
      summary: "update the blockchain sync state",
      protect: true,
    },
  })
  .input(updateStateInputSchema)
  .output(updateStateOutputSchema)
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
        lastLowerSyncedSlot,
        lastUpperSyncedSlot,
      },
    });
  });
