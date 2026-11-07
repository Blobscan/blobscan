import { TRPCError } from "@trpc/server";

import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  txHash: z.string(),
  index: z.number().int().nonnegative(),
});

const adjacentBlobSchema = z.object({
  versionedHash: z.string(),
  txHash: z.string(),
  index: z.number().int().nonnegative(),
});

const outputSchema = z.object({
  prev: adjacentBlobSchema.optional(),
  next: adjacentBlobSchema.optional(),
});

type Anchor = {
  blockHash: string;
  txIndex: number;
  index: number;
};

/**
 * Finds the blob next to the given one within the same block: first the
 * neighbouring blob in the same transaction and, when the given blob is the
 * first/last one of its transaction, the last/first blob of the previous/next
 * transaction of the block.
 */
async function fetchAdjacentBlob(
  prisma: BlobscanPrismaClient,
  direction: "prev" | "next",
  { blockHash, txIndex, index }: Anchor
) {
  const operator = direction === "prev" ? "lt" : "gt";
  const sort = direction === "prev" ? "desc" : "asc";

  const adjacentBlob = await prisma.blobsOnTransactions.findFirst({
    select: {
      blobHash: true,
      txHash: true,
      index: true,
    },
    where: {
      blockHash,
      OR: [
        {
          txIndex,
          index: {
            [operator]: index,
          },
        },
        {
          txIndex: {
            [operator]: txIndex,
          },
        },
      ],
    },
    orderBy: [{ txIndex: sort }, { index: sort }],
  });

  if (!adjacentBlob) {
    return;
  }

  return {
    versionedHash: adjacentBlob.blobHash,
    txHash: adjacentBlob.txHash,
    index: adjacentBlob.index,
  };
}

export const getAdjacentBlobs = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { txHash, index } }) => {
    const anchor = await prisma.blobsOnTransactions.findUnique({
      select: {
        blockHash: true,
        txIndex: true,
        index: true,
      },
      where: {
        txHash_index: {
          txHash,
          index,
        },
      },
    });

    if (!anchor) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No blob found at index ${index} of transaction '${txHash}'`,
      });
    }

    const [prev, next] = await Promise.all([
      fetchAdjacentBlob(prisma, "prev", anchor),
      fetchAdjacentBlob(prisma, "next", anchor),
    ]);

    return { prev, next };
  });
