import {
  isBlobReplicationAvailable,
  queueBlobsForReplication,
} from "@blobscan/blob-replicator";
import type { BlobReplicationJobData } from "@blobscan/blob-replicator/src/types";

import { tracer } from "../../instrumentation";
import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import { indexDataOutputSchema } from "./indexData.schema";
import { indexDataInputSchema } from "./indexData.schema";
import {
  createDBBlobs,
  createDBBlock,
  createDBTransactions,
} from "./indexData.utils";

export const indexData = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/block-txs-blobs`,
      tags: ["indexer"],
      summary: "Index data in the database",
      protect: true,
    },
  })
  .input(indexDataInputSchema)
  .output(indexDataOutputSchema)
  .mutation(async ({ ctx: { prisma, blobStorageManager }, input }) => {
    const operations = [];

    const newBlobs = await prisma.blob.filterNewBlobs(input.blobs);

    // 1. Upload blobs' data to storages
    const blobUploadResults = await tracer.startActiveSpan(
      "blobs-upload",
      async (blobsUploadSpan) => {
        const result = (
          await Promise.all(
            newBlobs.map(async (b) =>
              blobStorageManager
                .storeBlob(b, { useMainStorageOnly: true })
                .then((uploadRes) => ({
                  blob: b,
                  uploadRes,
                }))
            )
          )
        ).flat();

        blobsUploadSpan.end();

        return result;
      }
    );

    // 2. Queue block's blobs for replication to other storages
    const blobReplicationData = blobUploadResults.map<BlobReplicationJobData>(
      ({ blob, uploadRes }) => {
        const blobStorageRef = uploadRes.references[0];

        if (!blobStorageRef) {
          throw new Error(
            `Blob storage reference for blob ${blob.versionedHash} is missing`
          );
        }

        return {
          versionedHash: blob.versionedHash,
          blobStorageRef,
        };
      }
    );

    if (isBlobReplicationAvailable()) {
      queueBlobsForReplication(blobReplicationData);
    }

    // TODO: Create an upsert extension that set the `insertedAt` and the `updatedAt` field
    const now = new Date();

    // 3. Prepare address, block, transaction and blob insertions
    const dbTxs = createDBTransactions(input);
    const dbBlock = createDBBlock(input, dbTxs);
    const dbBlobs = createDBBlobs(input);
    const dbBlobStorageRefs = blobUploadResults.flatMap(
      ({ uploadRes: { references }, blob }) =>
        references.map((ref) => ({
          blobHash: blob.versionedHash,
          blobStorage: ref.storage,
          dataReference: ref.reference,
        }))
    );

    operations.push(
      prisma.block.upsert({
        where: { hash: input.block.hash },
        create: {
          ...dbBlock,
          insertedAt: now,
          updatedAt: now,
        },
        update: {
          ...dbBlock,
          updatedAt: now,
        },
      })
    );
    operations.push(
      prisma.address.upsertAddressesFromTransactions(input.transactions)
    );
    operations.push(prisma.transaction.upsertMany(dbTxs));
    operations.push(prisma.blob.upsertMany(dbBlobs));

    if (dbBlobStorageRefs.length) {
      operations.push(
        prisma.blobDataStorageReference.upsertMany(dbBlobStorageRefs)
      );
    }

    operations.push(
      prisma.blobsOnTransactions.createMany({
        data: input.blobs.map((blob) => ({
          blobHash: blob.versionedHash,
          txHash: blob.txHash,
          index: blob.index,
        })),
        skipDuplicates: true,
      })
    );

    // 4. Execute all database operations in a single transaction
    await prisma.$transaction(operations);
  });
