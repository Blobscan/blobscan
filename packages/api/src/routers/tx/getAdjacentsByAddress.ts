import type { BlobscanPrismaClient } from "@blobscan/db";
import { BlockModel, TransactionModel } from "@blobscan/db/prisma/zod";
import { addressSchema } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  senderAddress: addressSchema,
  blockTimestamp: BlockModel.shape.timestamp,
  txIndex: z.number().nonnegative(),
});

type Input = z.output<typeof inputSchema>;

const outputSchema = z.object({
  prevTxHash: TransactionModel.shape.hash.optional(),
  nextTxHash: TransactionModel.shape.hash.optional(),
});

function fetchAdjacentTransaction(
  prisma: BlobscanPrismaClient,
  adjacent: "next" | "prev",
  { senderAddress, blockTimestamp, txIndex }: Input
) {
  const operator = adjacent === "prev" ? "lt" : "gt";
  const sort = adjacent === "prev" ? "desc" : "asc";

  return prisma.transaction.findFirst({
    select: {
      hash: true,
    },
    where: {
      block: {
        transactionForks: {
          none: {},
        },
      },
      fromId: senderAddress,
      OR: [
        {
          AND: [
            { blockTimestamp },
            {
              index: {
                [operator]: txIndex,
              },
            },
          ],
        },
        {
          blockTimestamp: {
            [operator]: blockTimestamp,
          },
        },
      ],
    },
    orderBy: [
      {
        blockTimestamp: sort,
      },
      {
        index: sort,
      },
    ],
  });
}

export const getAdjacentsByAddress = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input }) => {
    const [prevTx, nextTx] = await Promise.all([
      fetchAdjacentTransaction(prisma, "prev", input),
      fetchAdjacentTransaction(prisma, "next", input),
    ]);

    return {
      prevTxHash: prevTx?.hash,
      nextTxHash: nextTx?.hash,
    };
  });
