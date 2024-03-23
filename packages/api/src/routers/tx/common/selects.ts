import { Prisma } from "@blobscan/db";
import type { Transaction as DBTransaction } from "@blobscan/db";

import type {
  Expands,
  ExpandedBlob,
  ExpandedBlock,
} from "../../../middlewares/withExpands";
import { blobReferenceSelect, blockReferenceSelect } from "../../../utils";
import type { DerivedTxBlobGasFields } from "../../../utils";

export type BaseTransaction = Pick<
  DBTransaction,
  | "blobAsCalldataGasUsed"
  | "blockHash"
  | "fromId"
  | "hash"
  | "maxFeePerBlobGas"
  | "rollup"
  | "toId"
> & {
  block: ExpandedBlock & { blobGasPrice: Prisma.Decimal };
  blobs: { blob: ExpandedBlob; index: number; blobHash: string }[];
};

export type FullQueriedTransaction = BaseTransaction & DerivedTxBlobGasFields;

export const baseTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    hash: true,
    fromId: true,
    toId: true,
    blobAsCalldataGasUsed: true,
    gasPrice: true,
    maxFeePerBlobGas: true,
    rollup: true,
    blockHash: true,
  });

export function createTransactionSelect(expands: Expands) {
  return Prisma.validator<Prisma.TransactionSelect>()({
    ...baseTransactionSelect,
    block: {
      select: {
        ...blockReferenceSelect,
        ...expands.expandedBlockSelect,
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        index: true,
        blobHash: true,
        blob: {
          select: {
            ...blobReferenceSelect,
            ...expands.expandedBlobSelect,
          },
        },
      },
    },
  });
}
