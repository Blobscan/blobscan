import { jwtAuthedProcedure } from "../../../procedures";
import { INDEXER_PATH } from "../constants";
import { updateSlotInputSchema, updateSlotOutputSchema } from "./schema";

export const updateSlot = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/slot`,
      tags: ["indexer"],
      summary: "Update the latest processed slot in the database",
      protect: true,
    },
  })
  .input(updateSlotInputSchema)
  .output(updateSlotOutputSchema)
  .mutation(async ({ ctx, input }) => {
    const slot = input.slot;

    await ctx.prisma.blockchainSyncState.upsert({
      where: { id: 1 },
      update: {
        lastSlot: slot,
      },
      create: {
        id: 1,
        lastSlot: slot,
        lastFinalizedBlock: 0,
      },
    });
  });
