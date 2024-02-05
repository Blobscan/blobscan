import { publicProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import {
  getLastSyncedSlotsInputSchema,
  getLastSyncedSlotsOutputSchema,
} from "./getLastSyncedSlots.schema";

export const getLastSyncedSlots = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `${INDEXER_PATH}/slot`,
      tags: ["indexer"],
      summary: "Get the latest processed slot from the database",
    },
  })
  .input(getLastSyncedSlotsInputSchema)
  .output(getLastSyncedSlotsOutputSchema)
  .query(async ({ ctx }) => {
    return (
      (await ctx.prisma.blockchainSyncState.findUnique({
        select: {
          lastLowerSyncedSlot: true,
          lastUpperSyncedSlot: true,
        },
        where: { id: 1 },
      })) ?? { lastLowerSyncedSlot: null, lastUpperSyncedSlot: null }
    );
  });
