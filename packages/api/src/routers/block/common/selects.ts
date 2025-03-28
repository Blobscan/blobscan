import type { Prisma } from "@blobscan/db";

import type {
  ExpandedBlob,
  ExpandedTransaction,
  Expands,
} from "../../../middlewares/withExpands";
import type { Filters } from "../../../middlewares/withFilters";
import type { Prettify } from "../../../utils";

export const baseBlockSelect = {
  hash: true,
  number: true,
  timestamp: true,
  slot: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  blobGasPrice: true,
  excessBlobGas: true,
} satisfies Prisma.BlockSelect;

const txIdSelect = {
  hash: true,
} satisfies Prisma.TransactionSelect;

const blobIdSelect = {
  blobHash: true,
} satisfies Prisma.BlobsOnTransactionsSelect;

export type BaseBlock = Prisma.BlockGetPayload<{
  select: typeof baseBlockSelect;
}>;

type TxId = Prisma.TransactionGetPayload<{
  select: typeof txIdSelect;
}>;

type BlobId = Prisma.BlobsOnTransactionsGetPayload<{
  select: typeof blobIdSelect;
}>;

type BlobOnTransaction = Prettify<BlobId & { blob?: Partial<ExpandedBlob> }>;

type Transaction = Prettify<
  TxId &
    Partial<ExpandedTransaction> & {
      blobs: BlobOnTransaction[];
    }
>;

export type Block = Prettify<
  BaseBlock & {
    transactions: Transaction[];
  }
>;

export function createBlockSelect(expands: Expands, filters?: Filters) {
  const blobExpand = expands.blob ? { blob: expands.blob } : {};
  const transactionExpand = expands.transaction?.select ?? {};

  return {
    ...baseBlockSelect,
    transactions: {
      select: {
        ...txIdSelect,
        ...transactionExpand,
        blobs: {
          select: {
            ...blobIdSelect,
            ...blobExpand,
          },
          orderBy: {
            index: "asc",
          },
        },
      },
      orderBy: {
        index: "asc",
      },
      where: filters?.transactionFilters,
    },
  } as Prisma.BlockSelect;
}
