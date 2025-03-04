import { z } from "@blobscan/zod";

import {
  serializeExpandedBlock,
  serializeExpandedTransaction,
  serializedExpandedBlockSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import {
  blobIndexSchema,
  blockNumberSchema,
  serializedBlobDataStorageReferenceSchema,
  serializeBlobDataStorageReferences,
  serializeDate,
} from "../../../utils";
import type { BaseBlob, Blob, BlobOnTransaction } from "./selects";

export type SerializedBlobDataStorageReference = z.infer<
  typeof serializedBlobDataStorageReferenceSchema
>;

export const serializedBaseBlobSchema = z.object({
  commitment: z.string(),
  proof: z.string(),
  size: z.number(),
  versionedHash: z.string(),
  data: z.string().optional(),
  dataStorageReferences: z.array(serializedBlobDataStorageReferenceSchema),
});

export type SerializedBaseBlob = z.infer<typeof serializedBaseBlobSchema>;

export const serializedBlobOnTransactionSchema = serializedBaseBlobSchema.merge(
  z.object({
    index: blobIndexSchema,
    txHash: z.string(),
    txIndex: z.number().nonnegative(),
    blockHash: z.string(),
    blockNumber: blockNumberSchema,
    blockTimestamp: z.string(),
    block: serializedExpandedBlockSchema.optional(),
    transaction: serializedExpandedTransactionSchema.optional(),
  })
);

export type SerializedBlobOnTransaction = z.infer<
  typeof serializedBlobOnTransactionSchema
>;

export const serializedBlobSchema = serializedBaseBlobSchema.merge(
  z.object({
    data: z.string(),
    transactions: z.array(
      z
        .object({
          hash: z.string(),
          txIndex: z.number().nonnegative(),
          index: blobIndexSchema,
          blockHash: z.string(),
          blockNumber: z.number().nonnegative(),
          blockTimestamp: z.date(),
          block: serializedExpandedBlockSchema.optional(),
        })
        .merge(serializedExpandedTransactionSchema)
    ),
  })
);

export type SerializedBlob = z.infer<typeof serializedBlobSchema>;

export function serializeBaseBlob({
  commitment,
  proof,
  size,
  versionedHash,
  dataStorageReferences,
}: BaseBlob): SerializedBaseBlob {
  return {
    commitment,
    proof,
    size,
    versionedHash,
    dataStorageReferences: serializeBlobDataStorageReferences(
      dataStorageReferences
    ),
  };
}

export function serializeBlobOnTransaction(
  blobOnTransaction: BlobOnTransaction
): SerializedBlobOnTransaction {
  const {
    blob,
    blockHash,
    blockNumber,
    blockTimestamp,
    index,
    txHash,
    txIndex,
    block,
    transaction,
  } = blobOnTransaction;
  const serializedBlob: SerializedBlobOnTransaction = {
    ...serializeBaseBlob(blob),
    blockHash,
    blockNumber,
    blockTimestamp: serializeDate(blockTimestamp),
    txHash,
    txIndex,
    index,
  };

  if (block) {
    serializedBlob.block = serializeExpandedBlock(block);
  }

  if (transaction) {
    const expandedTransaction = serializeExpandedTransaction(transaction);

    serializedBlob.transaction = expandedTransaction;
  }

  return serializedBlob;
}

export function serializeBlob(blob: Blob): SerializedBlob {
  const { data, transactions, ...baseBlob } = blob;
  const serializedBlob: SerializedBlob = {
    ...serializeBaseBlob(baseBlob),
    data,
    transactions: [],
  };

  if (transactions) {
    serializedBlob.transactions = transactions
      .sort((a, b) => a.txHash.localeCompare(b.txHash))
      .map(
        ({
          blockHash,
          blockNumber,
          blockTimestamp,
          txIndex,
          index,
          txHash,
          block,
          transaction,
        }) => ({
          index,
          txIndex,
          hash: txHash,
          blockHash,
          blockNumber,
          blockTimestamp,
          ...(transaction ? serializeExpandedTransaction(transaction) : {}),
          ...(block ? { block: serializeExpandedBlock(block) } : {}),
        })
      );
  }

  return serializedBlob;
}
