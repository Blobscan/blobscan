import { publicProcedure } from "../../procedures";
import { BASE_PATH } from "./common";
import { getStateInputSchema, getStateOutputSchema } from "./getState.schema";

export const getState = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: BASE_PATH,
      tags: ["indexer"],
      summary: "retrieves the blockchain sync state.",
    },
  })
  .input(getStateInputSchema)
  .output(getStateOutputSchema)
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
