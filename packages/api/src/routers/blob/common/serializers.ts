import { T } from "vitest/dist/types-3c7dbfa5";

import {
  Blob as DBBlob,
  BlobsOnTransactions as DBBlobsOnTransactions,
  BlobDataStorageReference as DBBlobDataStorageReference,
} from "@blobscan/db";
import { z } from "@blobscan/zod";

import {
  serializeExpandedBlock,
  serializeExpandedTransaction,
  serializedExpandedBlockSchema,
  serializedExpandedTransactionSchema,
} from "../../../middlewares/withExpands";
import type {
  ExpandedBlock,
  ExpandedTransaction,
} from "../../../middlewares/withExpands";
import {
  serializeBlobStorage,
  blobIndexSchema,
  blockNumberSchema,
  serializedBlobDataStorageReferenceSchema,
  isEmptyObject,
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

type Transaction = ExpandedTransaction & {
  block: ExpandedBlock;
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
    blockNumber: blockNumberSchema,
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
          block: z
            .object({
              number: blockNumberSchema,
            })
            .merge(serializedExpandedBlockSchema),
        })
        .merge(serializedExpandedTransactionSchema)
    ),
  })
);

export type SerializedBlob = z.infer<typeof serializedBlobSchema>;

export function serializeBlobDataStorageReference(
  dataStorageReference: Pick<
    DBBlobDataStorageReference,
    "blobStorage" | "dataReference"
  >
): SerializedBlobDataStorageReference {
  const { blobStorage, dataReference } = dataStorageReference;

  return {
    blobStorage: serializeBlobStorage(blobStorage),
    dataReference,
  };
}

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
    dataStorageReferences: dataStorageReferences.map(
      serializeBlobDataStorageReference
    ),
  };
}

export function serializeBlobOnTransaction(
  blobOnTransaction: BlobOnTransaction
): SerializedBlobOnTransaction {
  const { blob, transaction, index } = blobOnTransaction;

  const { hash, block } = transaction;
  const { number } = block;

  const expandedBlock = serializeExpandedBlock(transaction.block);
  const expandedTransaction = serializeExpandedTransaction(transaction);

  return {
    ...serializeBaseBlob(blob),
    index,
    blockNumber: number,
    txHash: hash,
    ...(isEmptyObject(expandedBlock) ? {} : { block: expandedBlock }),
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
    transactions: transactions.map(({ index, transaction }) => {
      const { block, hash } = transaction;
      const { number } = block;

      return {
        index,
        hash,
        ...serializeExpandedTransaction(transaction),
        block: {
          number,
          ...serializeExpandedBlock(block),
        },
      };
    }),
  };
}
