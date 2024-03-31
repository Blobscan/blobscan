import { Prisma } from "@blobscan/db";
import type { Transaction as DBTransaction } from "@blobscan/db";

import type {
  Expands,
  ExpandedBlock,
  ExpandedBlobData,
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
  | "gasPrice"
  | "rollup"
  | "toId"
> & {
  block: ExpandedBlock & { blobGasPrice: Prisma.Decimal };
  blobs: { blob: ExpandedBlobData; index: number; blobHash: string }[];
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

export function createTransactionSelect({
  expandedBlockSelect,
  expandedBlobSelect,
}: Expands) {
  return Prisma.validator<Prisma.TransactionSelect>()({
    ...baseTransactionSelect,
    block: {
      select: {
        ...blockReferenceSelect,
        ...expandedBlockSelect,
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
            ...expandedBlobSelect,
          },
        },
      },
    },
  });
}
