import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { findResponseBlob, responseBlobSchema } from "./helpers";

const inputSchema = z
  .object({
    txHash: z.string(),
    index: z.number().int().nonnegative(),
    direction: z.enum(["prev", "next"]),
  })
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = z
  .object({
    txHash: z.string(),
    index: z.number().int().nonnegative(),
    blob: responseBlobSchema.transform(normalize),
  })
  .nullable();

type AdjacentBlobsQuery = {
  prevTxHash: string | null;
  prevIndex: number | null;
  prevVersionedHash: string | null;
  nextTxHash: string | null;
  nextIndex: number | null;
  nextVersionedHash: string | null;
}[];

/**
 * Returns the previous or the next blob of the given blob position, with its
 * position. In the transaction of the position, the order is the blob index.
 * After the last blob of the transaction, the next blob is the first blob of
 * the next transaction of the same sender. Before the first blob, the previous
 * blob is the last blob of the previous transaction of the sender. The
 * transactions of the sender have the order of `tx.getSenderAdjacentsByHash`
 * (block timestamp, then transaction index), and the search does not return
 * transactions of reorged blocks. Returns `null` if there is no blob in that
 * direction.
 *
 * The blob has the format of `blob.getByBlobId` with the same `expand`. Thus
 * the client can put it in the `getByBlobId` cache, and the page of the blob
 * does not send a second request.
 *
 * One statement gets the adjacent positions in the two directions. Each
 * `LATERAL` subquery gets the values of the current position as parameters,
 * so each one is an index scan that stops at the first match:
 * - The blobs of the same transaction use the `(tx_hash, index)` primary key.
 * - The transactions of the sender use the `(from_id, block_timestamp, index)`
 *   index, with the same tuple comparison as `tx.getSenderAdjacentsByHash`.
 * - The blob of the adjacent transaction uses the `(tx_hash, index)` primary
 *   key.
 */
export const getAdjacentBlob = publicProcedure
  .input(inputSchema)
  .use(withExpands)
  .output(outputSchema)
  .use(withBlobSignedUrls)
  .query(
    async ({
      ctx: { expands, prisma },
      input: { txHash, index, direction },
    }) => {
      const [result] = await prisma.$queryRaw<AdjacentBlobsQuery>`
        SELECT
          COALESCE(tx_prev.tx_hash, sender_prev.tx_hash) AS "prevTxHash",
          COALESCE(tx_prev.index, sender_prev.index) AS "prevIndex",
          COALESCE(tx_prev.blob_hash, sender_prev.blob_hash) AS "prevVersionedHash",
          COALESCE(tx_next.tx_hash, sender_next.tx_hash) AS "nextTxHash",
          COALESCE(tx_next.index, sender_next.index) AS "nextIndex",
          COALESCE(tx_next.blob_hash, sender_next.blob_hash) AS "nextVersionedHash"
        FROM (
          SELECT bot.tx_hash, bot.index, t.from_id, t.block_timestamp, t.index AS tx_index
          FROM blobs_on_transactions bot
          JOIN transaction t ON t.hash = bot.tx_hash
          WHERE bot.tx_hash = ${txHash} AND bot.index = ${index}
        ) cur
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = cur.tx_hash AND bot.index < cur.index
          ORDER BY bot.index DESC
          LIMIT 1
        ) tx_prev ON true
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = cur.tx_hash AND bot.index > cur.index
          ORDER BY bot.index ASC
          LIMIT 1
        ) tx_next ON true
        LEFT JOIN LATERAL (
          SELECT t.hash
          FROM transaction t
          WHERE t.from_id = cur.from_id
            AND (t.from_id, t.block_timestamp, t.index) < (cur.from_id, cur.block_timestamp, cur.tx_index)
            AND NOT EXISTS (
              SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
            )
          ORDER BY t.from_id DESC, t.block_timestamp DESC, t.index DESC
          LIMIT 1
        ) sender_prev_tx ON true
        LEFT JOIN LATERAL (
          SELECT t.hash
          FROM transaction t
          WHERE t.from_id = cur.from_id
            AND (t.from_id, t.block_timestamp, t.index) > (cur.from_id, cur.block_timestamp, cur.tx_index)
            AND NOT EXISTS (
              SELECT 1 FROM transaction_fork tf WHERE tf.block_hash = t.block_hash
            )
          ORDER BY t.from_id ASC, t.block_timestamp ASC, t.index ASC
          LIMIT 1
        ) sender_next_tx ON true
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = sender_prev_tx.hash
          ORDER BY bot.index DESC
          LIMIT 1
        ) sender_prev ON true
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = sender_next_tx.hash
          ORDER BY bot.index ASC
          LIMIT 1
        ) sender_next ON true
      `;

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob found at index ${index} of transaction '${txHash}'`,
        });
      }

      const adjacent =
        direction === "prev"
          ? {
              txHash: result.prevTxHash,
              index: result.prevIndex,
              versionedHash: result.prevVersionedHash,
            }
          : {
              txHash: result.nextTxHash,
              index: result.nextIndex,
              versionedHash: result.nextVersionedHash,
            };

      if (
        adjacent.txHash === null ||
        adjacent.index === null ||
        adjacent.versionedHash === null
      ) {
        return null;
      }

      const blob = await findResponseBlob(
        prisma,
        expands,
        adjacent.versionedHash
      );

      if (!blob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob with versioned hash '${adjacent.versionedHash}'.`,
        });
      }

      return { txHash: adjacent.txHash, index: adjacent.index, blob };
    }
  );
