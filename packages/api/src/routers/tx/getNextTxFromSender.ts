import { prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const txNeighborSchema = z.object({
  senderAddress: z.string(),
  blockNumber: z.number(),
  index: z.number().nullable(),
});

type TxNeighborInput = z.infer<typeof txNeighborSchema>;

export const getTxNeighborsProcedure = publicProcedure
  .input(txNeighborSchema)
  .query<TxNeighbors>(({ input }) => getTxNeighbors(input));

type TxNeighbors = {
  next: string | null;
  prev: string | null;
};

async function getTxNeighbors(input: TxNeighborInput): Promise<TxNeighbors> {
  const [next, prev] = await Promise.all([
    getTxNeighbor(input, "next"),
    getTxNeighbor(input, "prev"),
  ]);

  return {
    next,
    prev,
  };
}

async function getTxNeighbor(
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
