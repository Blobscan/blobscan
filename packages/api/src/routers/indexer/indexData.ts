import type { Blob, Transaction, OmittableFields, Block } from "@blobscan/db";

import { tracer } from "../../instrumentation";
import { jwtAuthedProcedure } from "../../procedures";
import { INDEXER_PATH } from "./common";
import type { IndexDataInput } from "./indexData.schema";
import { indexDataOutputSchema } from "./indexData.schema";
import { indexDataInputSchema } from "./indexData.schema";
import {
  calculateBlobGasPrice,
  calculateBlobSize,
  getEIP2028CalldataGas,
} from "./indexData.utils";

function createDBTransactions({
  blobs,
  block,
  transactions,
}: IndexDataInput): Omit<Transaction, OmittableFields>[] {
  return transactions.map<Omit<Transaction, OmittableFields>>(
    ({ blockNumber, from, gasPrice, hash, maxFeePerBlobGas, to }) => {
      const txBlob: IndexDataInput["blobs"][0] | undefined = blobs.find(
        (b) => b.txHash === hash
      );

      if (!txBlob) {
        throw new Error(`Blob for transaction ${hash} not found`);
      }

      return {
        blockNumber,
        hash,
        fromId: from,
        toId: to,
        gasPrice,
        blobGasPrice: calculateBlobGasPrice(block.excessBlobGas),
        maxFeePerBlobGas,
        blobAsCalldataGasUsed: getEIP2028CalldataGas(txBlob.data),
      };
    }
  );
}

function createDBBlock(
  {
    block: { blobGasUsed, excessBlobGas, hash, number, slot, timestamp },
  }: IndexDataInput,
  dbTxs: Pick<Transaction, "blobAsCalldataGasUsed">[]
): Omit<Block, OmittableFields> {
  const blobAsCalldataGasUsed = dbTxs.reduce(
    (acc, tx) => acc + tx.blobAsCalldataGasUsed,
    0
  );

  return {
    number,
    hash,
    timestamp: new Date(timestamp * 1000),
    slot,
    blobGasUsed,
    blobGasPrice: calculateBlobGasPrice(excessBlobGas),
    excessBlobGas,
    blobAsCalldataGasUsed,
  };
}

function createDBBlobs({
  blobs,
  block,
}: IndexDataInput): Omit<Blob, OmittableFields>[] {
  const uniqueBlobVersionedHashes = Array.from(
    new Set(blobs.map((b) => b.versionedHash))
  );

  return uniqueBlobVersionedHashes.map<Omit<Blob, OmittableFields>>(
    (versionedHash) => {
      const blob = blobs.find((b) => b.versionedHash === versionedHash);

      // Type safety check to make TS happy
      if (!blob) {
        throw new Error(`Blob ${versionedHash} not found`);
      }

      return {
        versionedHash: blob.versionedHash,
        commitment: blob.commitment,
        size: calculateBlobSize(blob.data),
        firstBlockNumber: block.number,
      };
    }
  );
}

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

    // 1. Upload blobs' data to storages
    const blobUploadResults = await tracer.startActiveSpan(
      "blobs-upload",
      async (blobsUploadSpan) => {
        const newBlobs = await prisma.blob.filterNewBlobs(input.blobs);

        const result = (
          await Promise.all(
            newBlobs.map(async (b) =>
              blobStorageManager.storeBlob(b).then<{
                uploadRes: Awaited<
                  ReturnType<typeof blobStorageManager.storeBlob>
                >;
                blob: Awaited<
                  ReturnType<typeof prisma.blob.filterNewBlobs>
                >[number];
              }>((uploadRes) => ({
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

    blobUploadResults.forEach(({ uploadRes: { errors }, blob }) => {
      if (errors.length) {
        const errorMsgs = errors.map((e) => `${e.storage}: ${e.error}`);

        console.warn(
          `Couldn't upload blob ${
            blob.versionedHash
          } to some of the storages: ${errorMsgs.join(", ")}`
        );
      }
    });

    const dbBlobStorageRefs = blobUploadResults.flatMap(
      ({ uploadRes: { references }, blob }) =>
        references.map((ref) => ({
          blobHash: blob.versionedHash,
          blobStorage: ref.storage,
          dataReference: ref.reference,
        }))
    );

    // 2. Prepare address, block, transaction and blob insertions

    // TODO: Create an upsert extension that set the `insertedAt` and the `updatedAt` field
    const now = new Date();

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

    // 3. Execute all database operations in a single transaction
    await prisma.$transaction(operations);
  });