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
 * Returns the previous or the next blob of the given blob position in the
 * same block, with its position. The order is the transaction index, then the
 * blob index in the transaction. The search does not go into other blocks.
 * Returns `null` if the position is the first or the last one of the block.
 *
 * The blob has the format of `blob.getByBlobId` with the same `expand`. Thus
 * the client can put it in the `getByBlobId` cache, and the page of the blob
 * does not send a second request.
 *
 * One statement gets the two adjacent positions. Each side is a `LATERAL`
 * subquery that gets the values of the current position as parameters. It
 * reads only the rows of the block, through the `block_hash` index, and
 * compares the `(tx_index, index)` tuple.
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
          prev.tx_hash AS "prevTxHash",
          prev.index AS "prevIndex",
          prev.blob_hash AS "prevVersionedHash",
          next.tx_hash AS "nextTxHash",
          next.index AS "nextIndex",
          next.blob_hash AS "nextVersionedHash"
        FROM (
          SELECT block_hash, tx_index, index
          FROM blobs_on_transactions
          WHERE tx_hash = ${txHash} AND index = ${index}
        ) cur
        LEFT JOIN LATERAL (
          SELECT bot.blob_hash, bot.tx_hash, bot.index
          FROM blobs_on_transactions bot
          WHERE bot.block_hash = cur.block_hash
            AND (bot.tx_index, bot.index) < (cur.tx_index, cur.index)
          ORDER BY bot.tx_index DESC, bot.index DESC
          LIMIT 1
        ) prev ON true
        LEFT JOIN LATERAL (
          SELECT bot.blob_hash, bot.tx_hash, bot.index
          FROM blobs_on_transactions bot
          WHERE bot.block_hash = cur.block_hash
            AND (bot.tx_index, bot.index) > (cur.tx_index, cur.index)
          ORDER BY bot.tx_index ASC, bot.index ASC
          LIMIT 1
        ) next ON true
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
