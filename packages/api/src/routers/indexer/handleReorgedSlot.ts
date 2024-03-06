import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import {
  handleReorgedSlotInputSchema,
  handleReorgedSlotOutputSchema,
} from "./handleReorgedSlot.schema";

export const handleReorgedSlot = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/reorged-slot`,
      tags: ["indexer"],
      summary:
        "marks all blocks with slot greater than the new head slot as reorged.",
      protect: true,
    },
  })
  .input(handleReorgedSlotInputSchema)
  .output(handleReorgedSlotOutputSchema)
  .mutation(async ({ ctx: { prisma }, input: { newHeadSlot } }) => {
    // All blocks greater than the new head slot are reorged
    const reorgedBlocks = await prisma.block.findMany({
      select: {
        hash: true,
        transactions: {
          select: {
            hash: true,
          },
        },
      },
      where: {
        slot: {
          gt: newHeadSlot,
        },
      },
      orderBy: {
        slot: "asc",
      },
    });

    if (!reorgedBlocks.length) {
      return;
    }

    await prisma.transactionFork.upsertMany(
      reorgedBlocks.flatMap((b) =>
        b.transactions.map((tx) => ({
          hash: tx.hash,
          blockHash: b.hash,
        }))
      )
    );
  });
