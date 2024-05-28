import { z } from "@blobscan/zod";

import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";

const inputSchema = z.object({
  reorgedSlots: z.array(z.coerce.number().positive()).nonempty(),
});

const outputSchema = z.object({
  totalUpdatedSlots: z.number(),
});

export type HandleReorgedSlotsInput = z.infer<typeof inputSchema>;

export const handleReorgedSlots = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/reorged-slots`,
      tags: ["indexer"],
      summary:
        "marks all blocks with slots matching the given reorged slots as reorged.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ ctx: { prisma }, input: { reorgedSlots } }) => {
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
          in: reorgedSlots,
        },
      },
    });

    const result = await prisma.transactionFork.upsertMany(
      reorgedBlocks.flatMap((b) =>
        b.transactions.map((tx) => ({
          hash: tx.hash,
          blockHash: b.hash,
        }))
      )
    );

    let totalUpdatedSlots: number;

    if (typeof result === "number") {
      totalUpdatedSlots = result;
    } else {
      totalUpdatedSlots = result.reduce(
        (acc, totalSlots) => acc + totalSlots.count,
        0
      );
    }

    return {
      totalUpdatedSlots,
    };
  });
