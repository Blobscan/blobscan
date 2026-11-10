import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";

const inputSchema = z.object({
  txHash: z.string(),
  index: z.number().int().nonnegative(),
});

const adjacentBlobSchema = z.object({
  versionedHash: z.string(),
  txHash: z.string(),
  index: z.number().int().nonnegative(),
});

const outputSchema = z.object({
  prev: adjacentBlobSchema.optional(),
  next: adjacentBlobSchema.optional(),
});

type AdjacentBlobsQuery = {
  prevVersionedHash: string | null;
  prevTxHash: string | null;
  prevIndex: number | null;
  nextVersionedHash: string | null;
  nextTxHash: string | null;
  nextIndex: number | null;
}[];

function toAdjacentBlob(
  versionedHash: string | null,
  txHash: string | null,
  index: number | null
) {
  if (versionedHash === null || txHash === null || index === null) {
    return;
  }

  return { versionedHash, txHash, index };
}

/**
 * Returns the previous and next blobs of the given blob position in the same
 * block. The order is the transaction index, then the blob index in the
 * transaction. The search does not go into other blocks.
 *
 * One statement gets the two blobs, so the request uses one connection. Each
 * side is a `LATERAL` subquery that gets the values of the current position
 * as parameters. It reads only the rows of the block, through the
 * `block_hash` index, and compares the `(tx_index, index)` tuple.
 */
export const getAdjacentBlobs = publicProcedure
  .input(inputSchema)
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { txHash, index } }) => {
    const [result] = await prisma.$queryRaw<AdjacentBlobsQuery>`
      SELECT
        prev.blob_hash AS "prevVersionedHash",
        prev.tx_hash AS "prevTxHash",
        prev.index AS "prevIndex",
        next.blob_hash AS "nextVersionedHash",
        next.tx_hash AS "nextTxHash",
        next.index AS "nextIndex"
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

    return {
      prev: toAdjacentBlob(
        result.prevVersionedHash,
        result.prevTxHash,
        result.prevIndex
      ),
      next: toAdjacentBlob(
        result.nextVersionedHash,
        result.nextTxHash,
        result.nextIndex
      ),
    };
  });
