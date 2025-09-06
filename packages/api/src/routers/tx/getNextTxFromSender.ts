import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const txNeighborSchema = z.object({
  senderAddress: z.string(),
  blockNumber: z.number(),
  index: z.number().nullable(),
});

type TxNeighborInput = z.infer<typeof txNeighborSchema>;

async function getTxNeighbor(
  prisma: BlobscanPrismaClient,
  input: TxNeighborInput,
  direction: "next" | "prev"
): Promise<string | null> {
  const operator = direction === "next" ? "gt" : "lt";

  const tx = await prisma.transaction.findFirst({
    select: {
      hash: true,
    },
    where: {
      fromId: input.senderAddress,
      OR:
        input.index !== null
          ? [
              {
                blockNumber: {
                  [operator]: input.blockNumber,
                },
              },
              {
                blockNumber: input.blockNumber,
                index: {
                  [operator]: input.index,
                },
              },
            ]
          : [
              {
                blockNumber: {
                  [operator]: input.blockNumber,
                },
              },
            ],
    },
    orderBy:
      direction === "next"
        ? [{ blockNumber: "asc" }, { index: "asc" }]
        : [{ blockNumber: "desc" }, { index: "desc" }],
  });

  if (!tx) {
    return null;
  }

  return tx.hash;
}
export const getTxNeighborsProcedure = publicProcedure
  .input(txNeighborSchema)
  .query(async ({ ctx: { prisma }, input }) => {
    const [next, prev] = await Promise.all([
      getTxNeighbor(prisma, input, "next"),
      getTxNeighbor(prisma, input, "prev"),
    ]);

    return {
      next,
      prev,
    };
  });
