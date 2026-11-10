import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { withBlobSignedUrls } from "../../middlewares/withBlobSignedUrls";
import {
  createExpandsSchema,
  withExpands,
} from "../../middlewares/withExpands";
import { publicProcedure } from "../../procedures";
import {
  adjacentDirectionSchema,
  adjacentSqlParts,
  normalize,
} from "../../utils";
import { senderAdjacentTxSql } from "../tx/helpers";
import { findResponseBlob, responseBlobSchema } from "./helpers";

const blobPositionSchema = z.object({
  txHash: z.string(),
  index: z.number().int().nonnegative(),
});

const inputSchema = blobPositionSchema
  .extend({
    direction: adjacentDirectionSchema,
  })
  .merge(createExpandsSchema(["transaction", "block"]));

const outputSchema = blobPositionSchema
  .extend({
    blob: responseBlobSchema.transform(normalize),
  })
  .nullable();

type AdjacentBlobRow = {
  txHash: string | null;
  index: number | null;
  versionedHash: string | null;
};

/**
 * Returns the previous or the next blob of the given blob position, with its
 * position. In the transaction of the position, the order is the blob index.
 * After the last blob of the transaction, the next blob is the first blob of
 * the next transaction of the same sender. Before the first blob, the previous
 * blob is the last blob of the previous transaction of the sender. The
 * transactions of the sender have the order of `tx.getSenderAdjacentTx`
 * (block timestamp, then transaction index), and the search does not return
 * transactions of reorged blocks. Returns `null` if there is no blob in that
 * direction.
 *
 * The blob has the format of `blob.getByBlobId` with the same `expand`. Thus
 * the client can put it in the `getByBlobId` cache, and the page of the blob
 * does not send a second request.
 *
 * One statement gets the adjacent position in the requested direction. Each
 * `LATERAL` subquery gets the values of the current position as parameters,
 * so each one is an index scan that stops at the first match:
 * - The blobs of the same transaction use the `(tx_hash, index)` primary key.
 * - The transactions of the sender use `senderAdjacentTxSql`, which
 *   `tx.getSenderAdjacentTx` also uses.
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
      const { operator, order } = adjacentSqlParts(direction);

      const [adjacent] = await prisma.$queryRaw<AdjacentBlobRow[]>`
        SELECT
          COALESCE(in_tx.tx_hash, in_sender_tx.tx_hash) AS "txHash",
          COALESCE(in_tx.index, in_sender_tx.index) AS "index",
          COALESCE(in_tx.blob_hash, in_sender_tx.blob_hash) AS "versionedHash"
        FROM (
          -- senderAdjacentTxSql needs the transaction index as cur.tx_index.
          SELECT bot.tx_hash, bot.index, t.from_id, t.block_timestamp, t.index AS tx_index
          FROM blobs_on_transactions bot
          JOIN transaction t ON t.hash = bot.tx_hash
          WHERE bot.tx_hash = ${txHash} AND bot.index = ${index}
        ) cur
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = cur.tx_hash AND bot.index ${operator} cur.index
          ORDER BY bot.index ${order}
          LIMIT 1
        ) in_tx ON true
        -- Search the transactions of the sender only when the transaction of
        -- the position has no blob in that direction. The condition uses only
        -- values of the outer row, so Postgres does not run the subquery when
        -- it is false.
        LEFT JOIN LATERAL (
          SELECT adjacent_tx.hash
          FROM (${senderAdjacentTxSql(direction)}) adjacent_tx
          WHERE in_tx.tx_hash IS NULL
        ) sender_tx ON true
        LEFT JOIN LATERAL (
          SELECT bot.tx_hash, bot.index, bot.blob_hash
          FROM blobs_on_transactions bot
          WHERE bot.tx_hash = sender_tx.hash
          ORDER BY bot.index ${order}
          LIMIT 1
        ) in_sender_tx ON true
      `;

      if (!adjacent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No blob at index ${index} of transaction '${txHash}'.`,
        });
      }

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
