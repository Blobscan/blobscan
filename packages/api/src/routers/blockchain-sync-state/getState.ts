import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";

export const inputSchema = z.void();

export const outputSchema = z.object({
  lastAggregatedBlock: z.number().nullable(),
  lastFinalizedBlock: z.number().nullable(),
  lastLowerSyncedSlot: z.number().nullable(),
  lastUpperSyncedSlot: z.number().nullable(),
});

export const getState = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: BASE_PATH,
      tags: ["indexer"],
      summary: "retrieves the blockchain sync state.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx }) => {
    const state = await ctx.prisma.blockchainSyncState.findUnique({
      select: {
        lastAggregatedBlock: true,
        lastFinalizedBlock: true,
        lastLowerSyncedSlot: true,
        lastUpperSyncedSlot: true,
      },
      where: { id: 1 },
    });

    return (
      state ?? {
        lastAggregatedBlock: null,
        lastFinalizedBlock: null,
        lastLowerSyncedSlot: null,
        lastUpperSyncedSlot: null,
      }
    );
  });
