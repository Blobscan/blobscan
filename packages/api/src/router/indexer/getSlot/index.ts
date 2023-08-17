import { publicProcedure } from "../../../procedures";
import { INDEXER_PATH } from "../constants";
import { getSlotInputSchema, getSlotOutputSchema } from "./schema";

export const getSlot = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `${INDEXER_PATH}/slot`,
      tags: ["indexer"],
      summary: "Get the latest processed slot from the database",
    },
  })
  .input(getSlotInputSchema)
  .output(getSlotOutputSchema)
  .query(async ({ ctx }) => {
    const syncState = await ctx.prisma.blockchainSyncState.findUnique({
      where: { id: 1 },
    });

    return { slot: syncState?.lastSlot ?? 0 };
  });
