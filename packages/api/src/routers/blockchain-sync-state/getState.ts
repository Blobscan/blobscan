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
        lastLowerSyncedSlot: true,
        lastUpperSyncedSlot: true,
        lastFinalizedBlock: true,
      },
      where: { id: 1 },
    });

    return (
      state ?? {
        lastLowerSyncedSlot: null,
        lastUpperSyncedSlot: null,
        lastFinalizedBlock: null,
      }
    );
  });
