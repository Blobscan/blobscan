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
 * The query compares the full `(from_id, block_timestamp, index)` tuple and
 * checks the sender after the `LIMIT`, instead of filtering with
 * `from_id = …`. Postgres removes sort keys that an equality filter fixes, so
 * with `from_id = …` the planner can walk the `(block_timestamp, index)` index
 * and filter every row on the sender. When the sender has no adjacent
 * transaction, that scan reads the rest of the table. Without the equality,
 * only the `(from_id, block_timestamp, index)` index gives the order, so each
 * side reads one index entry (plus any reorged ones it skips).
 */
export const getAdjacentsByAddress = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { hash } }) => {
    const [result] = await prisma.$queryRaw<AdjacentTxsQueryResult>`
      WITH cur AS (
        SELECT from_id, block_timestamp, index
        FROM transaction
        WHERE hash = ${hash}
      )
      SELECT
        (
          SELECT prev.hash
          FROM (
            SELECT t.hash, t.from_id
            FROM transaction t, cur
            WHERE (t.from_id, t.block_timestamp, t.index) < (cur.from_id, cur.block_timestamp, cur.index)
              AND NOT EXISTS (
                SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
              )
            ORDER BY t.from_id DESC, t.block_timestamp DESC, t.index DESC
            LIMIT 1
          ) prev, cur
          WHERE prev.from_id = cur.from_id
        ) AS "prevTxHash",
        (
          SELECT next.hash
          FROM (
            SELECT t.hash, t.from_id
            FROM transaction t, cur
            WHERE (t.from_id, t.block_timestamp, t.index) > (cur.from_id, cur.block_timestamp, cur.index)
              AND NOT EXISTS (
                SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
              )
            ORDER BY t.from_id ASC, t.block_timestamp ASC, t.index ASC
            LIMIT 1
          ) next, cur
          WHERE next.from_id = cur.from_id
        ) AS "nextTxHash"
    `;

    return {
      prevTxHash: result?.prevTxHash ?? undefined,
      nextTxHash: result?.nextTxHash ?? undefined,
    };
  });
