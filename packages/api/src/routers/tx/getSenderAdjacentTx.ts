import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { adjacentDirectionSchema, normalize } from "../../utils";
import {
  createTransactionNotFoundError,
  getResponseTransaction,
  responseTransactionSchema,
  senderAdjacentTxSql,
} from "./helpers";

const inputSchema = z
  .object({
    hash: z.string(),
    direction: adjacentDirectionSchema,
  })
  .merge(createExpandsSchema(["block", "blob"]));

const outputSchema = responseTransactionSchema.transform(normalize).nullable();

type AdjacentTxQuery = {
  adjacentTxHash: string | null;
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
 * The query calculates only the requested direction, with the `LATERAL`
 * subquery from `senderAdjacentTxSql`.
 */
export const getSenderAdjacentTx = publicProcedure
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(async ({ ctx: { expands, prisma }, input: { hash, direction } }) => {
    const [result] = await prisma.$queryRaw<AdjacentTxQuery>`
      SELECT adjacent.hash AS "adjacentTxHash"
      FROM (
        SELECT from_id, block_timestamp, index AS tx_index
        FROM transaction
        WHERE hash = ${hash}
      ) cur
      LEFT JOIN LATERAL (${senderAdjacentTxSql(direction)}) adjacent ON true
    `;

    if (!result) {
      throw createTransactionNotFoundError(hash);
    }

    const adjacentHash = result.adjacentTxHash;

    if (!adjacentHash) {
      return null;
    }

    return getResponseTransaction(prisma, expands, adjacentHash);
  });
