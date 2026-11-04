import type { Prisma } from "@blobscan/db";
import { blockHashSchema } from "@blobscan/db/prisma/zod-utils";
import { z } from "@blobscan/zod";

import type { TRPCInnerContext } from "../../context";
import { createAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./helpers";

/**
 * Generates a set of Prisma operations to remove references to reorged blocks from the db.
 *
 * When blocks are no longer part of the canonical chain due to reorg, any references to these blocks
 * must be cleaned up from relevant tables to maintain database integrity.
 *
 * @returns An array of Prisma operation promises to be executed for database cleanup.
 */
async function generateBlockCleanupOperations(
  prisma: TRPCInnerContext["prisma"],
  reorgedBlockNumbers: number[]
) {
  const [addresses, blobs] = await Promise.all([
    prisma.address.findMany({
      where: {
        OR: [
          {
            firstBlockNumberAsSender: {
              in: reorgedBlockNumbers,
            },
          },
          {
            firstBlockNumberAsReceiver: {
              in: reorgedBlockNumbers,
            },
          },
        ],
      },
    }),
    prisma.blob.findMany({
      where: {
        firstBlockNumber: {
          in: reorgedBlockNumbers,
        },
      },
    }),
  ]);

  const referenceRemovalOps = [];

  for (const {
    address,
    firstBlockNumberAsReceiver,
    firstBlockNumberAsSender,
  } of addresses) {
    const data: Prisma.AddressUpdateInput = {};

    if (
      firstBlockNumberAsSender &&
      reorgedBlockNumbers.includes(firstBlockNumberAsSender)
    ) {
      data.firstBlockNumberAsSender = null;
    }

    if (
      firstBlockNumberAsReceiver &&
      reorgedBlockNumbers.includes(firstBlockNumberAsReceiver)
    ) {
      data.firstBlockNumberAsReceiver = null;
    }

    const hasBlockReferences = Object.keys(data).length > 0;

    if (hasBlockReferences) {
      referenceRemovalOps.push(
        prisma.address.update({
          data,
          where: {
            address,
          },
        })
      );
    }
  }

  for (const { firstBlockNumber, versionedHash } of blobs) {
    if (firstBlockNumber && reorgedBlockNumbers.includes(firstBlockNumber)) {
      referenceRemovalOps.push(
        prisma.blob.update({
          where: {
            versionedHash,
          },
          data: {
            firstBlockNumber: null,
          },
        })
      );
    }
  }

  return referenceRemovalOps;
}

const inputSchema = z.object({
  rewindedBlocks: z.array(blockHashSchema).optional(),
  forwardedBlocks: z.array(blockHashSchema).optional(),
});

export const handleReorg = createAuthedProcedure("indexer")
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/reorged-blocks`,
      tags: ["indexer"],
      summary:
        "marks rewinded blocks as reorged and unmarks the forwarded ones.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(z.void())
  .mutation(
    async ({ ctx: { prisma }, input: { rewindedBlocks, forwardedBlocks } }) => {
      const operations = [];

      if (rewindedBlocks?.length) {
        const blockTxs = await prisma.transaction.findMany({
          select: {
            hash: true,
            blockHash: true,
            blockNumber: true,
          },
          where: {
            blockHash: {
              in: rewindedBlocks,
            },
          },
        });

        if (blockTxs.length) {
          const reorgedBlockNumbers = Array.from(
            new Set(Array.from(blockTxs.map((tx) => tx.blockNumber)))
          );

          const blockCleanupOperations = await generateBlockCleanupOperations(
            prisma,
            reorgedBlockNumbers
          );

          operations.push(...blockCleanupOperations);
          operations.push(prisma.transactionFork.upsertMany(blockTxs));
        }
      }

      if (forwardedBlocks?.length) {
        operations.push(
          prisma.transactionFork.deleteMany({
            where: {
              blockHash: {
                in: forwardedBlocks,
              },
            },
          })
        );
      }

      await prisma.$transaction(operations);
    }
  );
