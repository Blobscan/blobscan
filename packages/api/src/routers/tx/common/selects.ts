import { Prisma } from "@blobscan/db";
import type {
  Block as DBBlock,
  Transaction as DBTransaction,
} from "@blobscan/db";

import type {
  Expands,
  ExpandedBlobData,
} from "../../../middlewares/withExpands";
import { blobReferenceSelect } from "../../../utils";
import type { DerivedTxBlobGasFields } from "../../../utils";

export type BaseTransaction = Pick<
  DBTransaction,
  | "blobAsCalldataGasUsed"
  | "blockHash"
  | "blockNumber"
  | "blockTimestamp"
  | "fromId"
  | "hash"
  | "maxFeePerBlobGas"
  | "gasPrice"
  | "rollup"
  | "toId"
> & {
  block: Partial<DBBlock>;
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
    blockNumber: true,
    blockTimestamp: true,
  });

export function createTransactionSelect(expands: Expands) {
  return Prisma.validator<Prisma.TransactionSelect>()({
    ...baseTransactionSelect,
    block: {
      select: {
        ...(expands.block?.select ?? {}),
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
            ...(expands.blob?.select ?? {}),
          },
        },
      },
    },
  });
}
