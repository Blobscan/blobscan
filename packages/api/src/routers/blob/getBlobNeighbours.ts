import { prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  txHash: z.string(),
  transactionIndex: z.number(),
  senderAddress: z.string(),
  blockNumber: z.number(),
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
            fromId: input.senderAddress,
            OR: [
              {
                blockNumber:
                  direction === "next"
                    ? { gt: input.blockNumber }
                    : { lt: input.blockNumber },
              },
              {
                blockNumber: input.blockNumber,
                index:
                  direction === "next"
                    ? { gt: input.transactionIndex }
                    : { lt: input.transactionIndex },
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
