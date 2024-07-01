import type {
  Blob as DBBlob,
  BlobsOnTransactions as DBBlobsOnTransactions,
  BlobDataStorageReference as DBBlobDataStorageReference,
  Transaction as DBTransaction,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import {
  serializeExpandedBlock,
  serializeExpandedTransaction,
  serializedExpandedBlockSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import type { ExpandedBlock } from "../../../middlewares/withExpands";
import {
  blobIndexSchema,
  blockNumberSchema,
  serializedBlobDataStorageReferenceSchema,
  isEmptyObject,
  serializeBlobDataStorageReferences,
  serializeDate,
} from "../../../utils";

type BaseBlob = Pick<
  DBBlob,
  "commitment" | "proof" | "size" | "versionedHash"
> & {
  dataStorageReferences: Pick<
    DBBlobDataStorageReference,
    "blobStorage" | "dataReference"
  >[];
};

type Transaction = Omit<DBTransaction, "insertedAt" | "updatedAt"> & {
  block?: ExpandedBlock;
};

type Blob = BaseBlob & {
  data: string;
  transactions: {
    index: number;
    transaction: Transaction;
  }[];
};

type BlobOnTransaction = Pick<DBBlobsOnTransactions, "index"> & {
  blob: BaseBlob;
  transaction: Transaction;
};

export type SerializedBlobDataStorageReference = z.infer<
  typeof serializedBlobDataStorageReferenceSchema
>;

export const serializedBaseBlobSchema = z.object({
  commitment: z.string(),
  proof: z.string().nullable(),
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
  const { blob, transaction, index } = blobOnTransaction;

  const { hash, blockHash, blockTimestamp, blockNumber, block } = transaction;

  const expandedBlock = block ? serializeExpandedBlock(block) : undefined;
  const expandedTransaction = serializeExpandedTransaction(transaction);

  return {
    ...serializeBaseBlob(blob),
    index,
    blockHash,
    blockNumber,
    blockTimestamp: serializeDate(blockTimestamp),
    txHash: hash,
    ...(expandedBlock ? { block: expandedBlock } : {}),
    ...(isEmptyObject(expandedTransaction)
      ? {}
      : { transaction: expandedTransaction }),
  };
}

export function serializeBlob(blob: Blob): SerializedBlob {
  const { transactions, ...baseBlob } = blob;

  return {
    ...serializeBaseBlob(baseBlob),
    data: blob.data,
    transactions: transactions
      .sort((a, b) => a.transaction.hash.localeCompare(b.transaction.hash))
      .map(({ index, transaction }) => {
        const { block, hash, blockHash, blockNumber, blockTimestamp } =
          transaction;

        return {
          index,
          hash,
          blockHash,
          blockNumber,
          blockTimestamp,
          ...serializeExpandedTransaction(transaction),
          ...(block ? { block: serializeExpandedBlock(block) } : {}),
        };
      }),
  };
}
