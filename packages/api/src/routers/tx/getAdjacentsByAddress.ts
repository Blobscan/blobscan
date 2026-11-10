import { TransactionSchema } from "@blobscan/db";
import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  hash: z.string(),
});

const outputSchema = z.object({
  prevTxHash: TransactionSchema.shape.hash.optional(),
  nextTxHash: TransactionSchema.shape.hash.optional(),
});

type AdjacentTxsQueryResult = {
  prevTxHash: string | null;
  nextTxHash: string | null;
}[];

/**
 * Returns the previous and next transactions of the sender of the given
 * transaction, skipping transactions of reorged blocks.
 *
 * Each side is a `LATERAL` subquery. The `LATERAL` join gives the values of
 * the current transaction to the inner index scan as parameters. Thus
 * Postgres uses the tuple comparison and `from_id = …` as the `Index Cond`
 * of the `(from_id, block_timestamp, index)` index. The scan starts at the
 * current transaction and stops at the first transaction that is not reorged.
 *
 * Do not get the current transaction from a CTE and join it in the
 * subqueries. Postgres then applies the tuple comparison as a join filter,
 * not as an index condition. The scan then starts at one end of the index
 * and can read all the rows of the table.
 */
export const getAdjacentsByAddress = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { hash } }) => {
    const [result] = await prisma.$queryRaw<AdjacentTxsQueryResult>`
      SELECT prev.hash AS "prevTxHash", next.hash AS "nextTxHash"
      FROM (
        SELECT from_id, block_timestamp, index
        FROM transaction
        WHERE hash = ${hash}
      ) cur
      LEFT JOIN LATERAL (
        SELECT t.hash
        FROM transaction t
        WHERE t.from_id = cur.from_id
          AND (t.from_id, t.block_timestamp, t.index) < (cur.from_id, cur.block_timestamp, cur.index)
          AND NOT EXISTS (
            SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
          )
        ORDER BY t.from_id DESC, t.block_timestamp DESC, t.index DESC
        LIMIT 1
      ) prev ON true
      LEFT JOIN LATERAL (
        SELECT t.hash
        FROM transaction t
        WHERE t.from_id = cur.from_id
          AND (t.from_id, t.block_timestamp, t.index) > (cur.from_id, cur.block_timestamp, cur.index)
          AND NOT EXISTS (
            SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
          )
        ORDER BY t.from_id ASC, t.block_timestamp ASC, t.index ASC
        LIMIT 1
      ) next ON true
    `;

    return {
      prevTxHash: result?.prevTxHash ?? undefined,
      nextTxHash: result?.nextTxHash ?? undefined,
    };
  });
