import type { BlobDataStorageReference } from "@blobscan/db";
import { toBigIntSchema, z } from "@blobscan/zod";

import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import {
  createDBBlobs,
  createDBBlock,
  createDBTransactions,
} from "./indexData.utils";

export const inputSchema = z.object({
  block: z.object({
    number: z.coerce.number(),
    hash: z.string(),
    timestamp: z.coerce.number(),
    slot: z.coerce.number(),
    blobGasUsed: toBigIntSchema,
    excessBlobGas: toBigIntSchema,
  }),
  transactions: z.array(
    z.object({
      hash: z.string(),
      from: z.string(),
      to: z.string(),
      blockNumber: z.coerce.number(),
      gasPrice: toBigIntSchema,
      maxFeePerBlobGas: toBigIntSchema,
    })
  ),
  blobs: z.array(
    z.object({
      versionedHash: z.string(),
      commitment: z.string(),
      proof: z.string(),
      data: z.string(),
      txHash: z.string(),
      index: z.coerce.number(),
    })
  ),
});

export const outputSchema = z.void();

export type IndexDataInput = z.infer<typeof inputSchema>;

export const indexData = jwtAuthedProcedure
  .meta({
    openapi: {
      method: "PUT",
      path: `${INDEXER_PATH}/block-txs-blobs`,
      tags: ["indexer"],
      summary: "indexes data in the database.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(
    async ({ ctx: { prisma, blobStorageManager, blobPropagator }, input }) => {
      const operations = [];

      const newBlobs = await prisma.blob.filterNewBlobs(input.blobs);

      let dbBlobStorageRefs: BlobDataStorageReference[] | undefined;

      // 2. Store blobs' data
      if (!blobPropagator) {
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

      // 5. Propagate blobs to storages
      if (blobPropagator) {
        await blobPropagator.propagateBlobs(newBlobs);
      }
    }
  );
