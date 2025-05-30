import { TRPCError } from "@trpc/server";

import { BlockchainSyncStateModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";
import { isNullish } from "../../utils";
import { BASE_PATH } from "./common";

export const inputSchema = BlockchainSyncStateModel.omit({
  id: true,
}).partial();

export const outputSchema = z.void();

export const updateState = createAuthedProcedure("indexer")
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
  .mutation(
    async ({
      ctx,
      input: {
        lastLowerSyncedSlot,
        lastUpperSyncedSlot,
        lastFinalizedBlock,
        lastUpperSyncedBlockRoot,
        lastUpperSyncedBlockSlot,
      },
    }) => {
      if (
        !isNullish(lastLowerSyncedSlot) &&
        !isNullish(lastUpperSyncedSlot) &&
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
          lastUpperSyncedBlockRoot,
          lastUpperSyncedBlockSlot,
        },
        create: {
          id: 1,
          lastLowerSyncedSlot,
          lastUpperSyncedSlot,
          lastFinalizedBlock,
          lastUpperSyncedBlockRoot,
          lastUpperSyncedBlockSlot,
        },
      });
    }
  );
