import { TRPCError } from "@trpc/server";

import { TransactionSchema } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { senderAdjacentTxSql } from "./helpers";

const inputSchema = z.object({
  hash: z.string(),
});

const outputSchema = z.object({
  prevTxHash: TransactionSchema.shape.hash.optional(),
  nextTxHash: TransactionSchema.shape.hash.optional(),
});

type AdjacentTxsQuery = {
  prevTxHash: string | null;
  nextTxHash: string | null;
}[];

/**
 * Returns the previous and next transactions of the sender of the given
 * transaction. It does not return transactions of reorged blocks.
 *
 * Each side is a `LATERAL` subquery from `senderAdjacentTxSql`.
 */
export const getSenderAdjacentsByHash = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { hash } }) => {
    const [result] = await prisma.$queryRaw<AdjacentTxsQuery>`
      SELECT prev.hash AS "prevTxHash", next.hash AS "nextTxHash"
      FROM (
        -- senderAdjacentTxSql needs the transaction index as cur.tx_index.
        SELECT from_id, block_timestamp, index AS tx_index
        FROM transaction
        WHERE hash = ${hash}
      ) cur
      LEFT JOIN LATERAL (${senderAdjacentTxSql("prev")}) prev ON true
      LEFT JOIN LATERAL (${senderAdjacentTxSql("next")}) next ON true
    `;

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${hash}'.`,
      });
    }

    return {
      prevTxHash: result.prevTxHash ?? undefined,
      nextTxHash: result.nextTxHash ?? undefined,
    };
  });
