import type { Prisma } from "@blobscan/db";

import type {
  ExpandedBlob,
  ExpandedBlock,
  Expands,
} from "../../../middlewares/withExpands";
import type { TransactionFeeFields, Prettify } from "../../../utils";

export const baseTransactionSelect = {
  hash: true,
  toId: true,
  blobGasUsed: true,
  blobAsCalldataGasUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
  category: true,
  blockHash: true,
  blockNumber: true,
  blockTimestamp: true,
  index: true,
  decodedFields: true,
  from: {
    select: {
      address: true,
      rollup: true,
    },
  },
} satisfies Prisma.TransactionSelect;

export type BaseTransaction = Prisma.TransactionGetPayload<{
  select: typeof baseTransactionSelect;
}>;

type BlobHash = Prisma.BlobsOnTransactionsGetPayload<{
  select: {
    blobHash: true;
  };
}>;

type BlobOnTransaction = Prettify<
  BlobHash & { blob?: ExpandedBlob; data?: string }
>;

export type IncompletedTransaction = Prettify<
  BaseTransaction & {
    block: { blobGasPrice: Prisma.Decimal } & Partial<ExpandedBlock>;
    blobs: BlobOnTransaction[];
  }
>;

export type Transaction = Prettify<
  IncompletedTransaction & TransactionFeeFields
>;

export function createTransactionSelect<E extends Expands>(expands: E) {
  const blobExpand = expands.blob ? { blob: expands.blob } : {};
  const blockExpand = expands.block?.select ?? {};

  return {
    ...baseTransactionSelect,
    block: {
      select: {
        blobGasPrice: true,
        ...blockExpand,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        ...blobExpand,
      },
      orderBy: {
        index: "asc",
      },
    },
  } satisfies Prisma.TransactionSelect;
}
