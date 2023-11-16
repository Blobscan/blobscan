import type { $Enums } from "@blobscan/db";

import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import {
  indexDataInputSchema,
  indexDataOutputSchema,
} from "./indexData.schema";
import {
  createDBBlobs,
  createDBBlock,
  createDBTransactions,
} from "./indexData.utils";

type DBBlobStorageRef = {
  blobHash: string;
  blobStorage: $Enums.BlobStorage;
  dataReference: string;
};

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
  .mutation(
    async ({ ctx: { prisma, blobStorageManager, blobPropagator }, input }) => {
      const operations = [];

      const newBlobs = await prisma.blob.filterNewBlobs(input.blobs);

      let dbBlobStorageRefs: DBBlobStorageRef[] | undefined;

      // 2. Store blobs' data
      if (blobPropagator) {
        await blobPropagator.propagateBlobs(newBlobs);
      } else {
        const blobStorageOps = newBlobs.map(async (b) =>
          blobStorageManager.storeBlob(b).then((uploadRes) => ({
            blob: b,
            uploadRes,
          }))
        );
        const storageResults = (await Promise.all(blobStorageOps)).flat();

        dbBlobStorageRefs = storageResults.flatMap(
          ({ uploadRes: { references }, blob }) =>
            references.map((ref) => ({
              blobHash: blob.versionedHash,
              blobStorage: ref.storage,
              dataReference: ref.reference,
            }))
        );
      }

      // TODO: Create an upsert extension that set the `insertedAt` and the `updatedAt` field
      const now = new Date();

      // 3. Prepare address, block, transaction and blob insertions
      const dbTxs = createDBTransactions(input);
      const dbBlock = createDBBlock(input, dbTxs);
      const dbBlobs = createDBBlobs(input);

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

      if (dbBlobStorageRefs?.length) {
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
    }
  );
