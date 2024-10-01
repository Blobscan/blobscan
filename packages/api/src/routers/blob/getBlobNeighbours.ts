import { prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  commitment: z.string(),
});

type Input = z.infer<typeof inputSchema>;

export const getBlobNeighbours = publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const [next, prev] = await Promise.all([
      getBlobNeighbor(input, "next"),
      getBlobNeighbor(input, "prev"),
    ]);

    return {
      next,
      prev,
    };
  });

async function getBlobNeighbor(
  input: Input,
  direction: "next" | "prev"
): Promise<string | null> {
  const blob = await prisma.blobsOnTransactions.findFirst({
    where: {
      blob: {
        commitment: input.commitment,
      },
    },
    select: {
      index: true,
      blockNumber: true,
      transaction: {
        select: {
          hash: true,
          fromId: true,
          index: true,
        },
      },
    },
  });

  if (!blob) {
    return null;
  }

  const nextBlobInTx = await prisma.blobsOnTransactions.findFirst({
    where: {
      OR: [
        // Same transaction
        {
          txHash: blob.transaction.hash,
          index: direction === "next" ? { gt: blob.index } : { lt: blob.index },
        },
        // Next/prev transaction
        {
          transaction: {
            fromId: blob.transaction.fromId,
            OR:
              blob.transaction.index !== null
                ? [
                    {
                      blockNumber:
                        direction === "next"
                          ? { gt: blob.blockNumber }
                          : { lt: blob.blockNumber },
                    },
                    {
                      AND: [
                        { blockNumber: blob.blockNumber },
                        {
                          index:
                            direction === "next"
                              ? { gt: blob.transaction.index }
                              : { lt: blob.transaction.index },
                        },
                      ],
                    },
                  ]
                : [
                    {
                      blockNumber:
                        direction === "next"
                          ? { gt: blob.blockNumber }
                          : { lt: blob.blockNumber },
                    },
                  ],
          },
        },
      ],
    },
    select: {
      blobHash: true,
    },
    orderBy:
      direction === "next"
        ? [
            { index: "asc" },
            { transaction: { index: "asc" } },
            { transaction: { blockNumber: "asc" } },
          ]
        : [
            { index: "desc" },
            { transaction: { index: "desc" } },
            { transaction: { blockNumber: "desc" } },
          ],
  });

  if (nextBlobInTx) {
    return nextBlobInTx.blobHash;
  }

  return null;
}
