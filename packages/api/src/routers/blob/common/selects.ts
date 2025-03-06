import type { Prisma } from "@blobscan/db";

import type {
  ExpandedBlock,
  ExpandedTransaction,
  Expands,
} from "../../../middlewares/withExpands";
import type { Prettify } from "../../../utils";
import { dataStorageReferencesSelect } from "../../../utils";

export const baseBlobSelect = {
  commitment: true,
  proof: true,
  size: true,
  versionedHash: true,
  dataStorageReferences: {
    select: dataStorageReferencesSelect,
  },
} satisfies Prisma.BlobSelect;

export const baseBlobOnTransactionSelect = {
  blobHash: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  txHash: true,
  txIndex: true,
} satisfies Prisma.BlobsOnTransactionsSelect;

export type BaseBlob = Prisma.BlobGetPayload<{ select: typeof baseBlobSelect }>;
export type BaseBlobOnTransaction = Prisma.BlobsOnTransactionsGetPayload<{
  select: typeof baseBlobOnTransactionSelect;
}>;

type BlobTransactions = Prettify<
  BaseBlobOnTransaction & {
    block?: ExpandedBlock;
    transaction?: ExpandedTransaction;
  }
>;

export type Blob = Prettify<
  BaseBlob & {
    data: string;
    transactions?: BlobTransactions[];
  }
>;

export type BlobOnTransaction = Prettify<
  BaseBlobOnTransaction & {
    blob: BaseBlob;
    block?: ExpandedBlock;
    transaction?: ExpandedTransaction;
  }
>;

export function createBlobSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? { transaction: expands.transaction }
    : {};

  return {
    ...baseBlobSelect,
    transactions: {
      select: {
        ...baseBlobOnTransactionSelect,
        ...blockExpand,
        ...txExpand,
      },
    },
  } satisfies Prisma.BlobSelect;
}

export function createBlobsOnTransactionsSelect(expands: Expands) {
  const blockExpand = expands.block ? { block: expands.block } : {};
  const txExpand = expands.transaction
    ? { transaction: expands.transaction }
    : {};

  return {
    ...baseBlobOnTransactionSelect,
    blob: {
      select: baseBlobSelect,
    },
    ...txExpand,
    ...blockExpand,
  } satisfies Prisma.BlobsOnTransactionsSelect;
}
