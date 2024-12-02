import type { Prisma } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { TRPCInnerContext } from "../../context";
import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";

const inputSchema = z.object({
  reorgedSlots: z.array(z.coerce.number().positive()).nonempty(),
});

const outputSchema = z.object({
  totalUpdatedSlots: z.number(),
});

export type HandleReorgedSlotsInput = z.infer<typeof inputSchema>;

const blockSelect = {
  hash: true,
  number: true,
  transactions: {
    select: {
      hash: true,
    },
  },
} satisfies Prisma.BlockSelect;

type BlockPayload = Prisma.BlockGetPayload<{ select: typeof blockSelect }>;

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
  reorgedBlocks: BlockPayload[]
) {
  const reorgedBlockNumbers = reorgedBlocks.map((b) => b.number);
  const [addressCategoryInfos, blobs] = await Promise.all([
    prisma.addressCategoryInfo.findMany({
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
    id,
    firstBlockNumberAsReceiver,
    firstBlockNumberAsSender,
  } of addressCategoryInfos) {
    const data: Prisma.AddressCategoryInfoUpdateInput = {};

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
        prisma.addressCategoryInfo.update({
          data,
          where: {
            id,
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

export const handleReorgedSlots = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/reorged-slots`,
      tags: ["indexer"],
      summary:
        "marks all blocks with slots matching the given reorged slots as reorged.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(async ({ ctx: { prisma }, input: { reorgedSlots } }) => {
    const reorgedBlocks = await prisma.block.findMany({
      select: blockSelect,
      where: {
        slot: {
          in: reorgedSlots,
        },
      },
    });
    const reorgedBlockTxs = reorgedBlocks.flatMap((b) =>
      b.transactions.map((tx) => ({
        hash: tx.hash,
        blockHash: b.hash,
      }))
    );

    const blockReferenceRemovalOps = await generateBlockCleanupOperations(
      prisma,
      reorgedBlocks
    );

    await prisma.$transaction([
      ...blockReferenceRemovalOps,
      prisma.transactionFork.upsertMany(reorgedBlockTxs),
    ]);

    return {
      totalUpdatedSlots: reorgedBlocks.length,
    };
  });
