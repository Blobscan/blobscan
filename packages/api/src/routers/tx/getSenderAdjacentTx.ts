import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { findResponseTransaction, responseTransactionSchema } from "./helpers";

const inputSchema = z
  .object({
    hash: z.string(),
    direction: z.enum(["prev", "next"]),
  })
  .merge(createExpandsSchema(["block", "blob"]));

const outputSchema = responseTransactionSchema.transform(normalize).nullable();

type AdjacentTxsQuery = {
  prevTxHash: string | null;
  nextTxHash: string | null;
}[];

/**
 * Returns the previous or the next transaction of the sender of the given
 * transaction. The order is the block timestamp, then the transaction index.
 * It does not return transactions of reorged blocks. Returns `null` if the
 * sender has no transaction in that direction.
 *
 * The transaction has the format of `tx.getByHash` with the same `expand`.
 * Thus the client can put it in the `getByHash` cache, and the page of the
 * transaction does not send a second request.
 *
 * Each side is a `LATERAL` subquery. The `LATERAL` join gives the values of
 * the current transaction to the inner index scan as parameters. Therefore
 * Postgres uses the tuple comparison and `from_id = …` as the `Index Cond`
 * of the `(from_id, block_timestamp, index)` index. The scan starts at the
 * current transaction and stops at the first transaction that is not reorged.
 *
 * Do not get the current transaction from a CTE and join it in the
 * subqueries. Postgres then applies the tuple comparison as a join filter,
 * not as an index condition. The scan then starts at one end of the index
 * and can read all the rows of the table.
 */
export const getSenderAdjacentTx = publicProcedure
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { expands, prisma }, input: { hash, direction } }) => {
    const [result] = await prisma.$queryRaw<AdjacentTxsQuery>`
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

    if (!result) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${hash}'.`,
      });
    }

    const adjacentHash =
      direction === "prev" ? result.prevTxHash : result.nextTxHash;

    if (!adjacentHash) {
      return null;
    }

    const adjacentTx = await findResponseTransaction(
      prisma,
      expands,
      adjacentHash
    );

    if (!adjacentTx) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No transaction with hash '${adjacentHash}'.`,
      });
    }

    return adjacentTx;
  });
