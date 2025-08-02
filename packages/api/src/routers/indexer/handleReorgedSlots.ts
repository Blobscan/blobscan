import { z } from "@blobscan/zod";

import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";

const inputSchema = z.object({
  reorgedSlots: z.array(z.coerce.number().positive()).nonempty(),
});

const outputSchema = z.object({
  totalUpdatedSlots: z.number(),
});

export type HandleReorgedSlotsInput = z.infer<typeof inputSchema>;

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
    // 1. Query reorged blocks and their related data
    const reorgedBlocks = await prisma.block.findMany({
      select: {
        hash: true,
        slot: true,
        timestamp: true,
        transactions: {
          select: {
            hash: true,
          },
        },
      },
      where: {
        slot: {
          in: reorgedSlots,
        },
      },
    });

    // 2. Create transaction fork records
    const result = await prisma.transactionFork.upsertMany(
      reorgedBlocks.flatMap((b) =>
        b.transactions.map((tx) => ({
          hash: tx.hash,
          blockHash: b.hash,
        }))
      )
    );

    // 3. Delete reorged block related data to prepare for re-indexing
    const operations = [];

    // Delete blobsOnTransactions for reorged blocks
    const reorgedTxHashes = reorgedBlocks.flatMap(b => 
      b.transactions.map(tx => tx.hash)
    );
    
    if (reorgedTxHashes.length > 0) {
      operations.push(
        prisma.blobsOnTransactions.deleteMany({
          where: {
            txHash: {
              in: reorgedTxHashes
            }
          }
        })
      );
    }

    // Delete transactions for reorged blocks
    const reorgedBlockHashes = reorgedBlocks.map(b => b.hash);
    operations.push(
      prisma.transaction.deleteMany({
        where: {
          blockHash: {
            in: reorgedBlockHashes
          }
        }
      })
    );

    // Delete blobDataStorageReference for reorged blocks
    // Note: We need to query which blobs are only referenced by these reorged blocks
    const reorgedBlobHashes = await prisma.blob.findMany({
      where: {
        transactions: {
          some: {
            transaction: {
              blockHash: {
                in: reorgedBlockHashes
              }
            }
          }
        }
      },
      include: {
        transactions: {
          include: {
            transaction: {
              select: { blockHash: true }
            }
          }
        }
      }
    });

    // Only delete blobs that are exclusively referenced by reorged blocks
    const safeToDeleteBlobs = reorgedBlobHashes
      .filter(blob => blob.transactions.every((btx: any) => 
        reorgedBlockHashes.includes(btx.transaction.blockHash)
      ))
      .map(blob => blob.versionedHash);

    if (safeToDeleteBlobs.length > 0) {
      operations.push(
        prisma.blobDataStorageReference.deleteMany({
          where: {
            blobHash: {
              in: safeToDeleteBlobs
            }
          }
        })
      );

      operations.push(
        prisma.blob.deleteMany({
          where: {
            versionedHash: {
              in: safeToDeleteBlobs
            }
          }
        })
      );
    }

    // Delete reorged blocks
    operations.push(
      prisma.block.deleteMany({
        where: {
          slot: {
            in: reorgedSlots
          }
        }
      })
    );

    // 4. Execute delete operations
    await prisma.$transaction(operations);

    let totalUpdatedSlots: number;

    if (typeof result === "number") {
      totalUpdatedSlots = result;
    } else {
      totalUpdatedSlots = result.reduce(
        (acc, totalSlots) => acc + totalSlots.count,
        0
      );
    }

    return {
      totalUpdatedSlots,
    };
  });
