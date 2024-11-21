import type {
  BlobStorage as BlobStorageEnum,
  Rollup as RollupEnum,
  Category as CategoryEnum,
} from "@blobscan/api/enums";

import type { MakeFieldRequired } from "./helpers";
import type {
  GetByBlobIdOutput,
  GetByBlockIdOutput,
  GetTxByHashOutput,
} from "./routers";

export type BlobStorage = Lowercase<BlobStorageEnum>;

export type Rollup = Lowercase<RollupEnum>;

export type Category = Lowercase<CategoryEnum>;

export type Blob = GetByBlobIdOutput;

export type Block = GetByBlockIdOutput;

export type Transaction = GetTxByHashOutput;

export type TransactionWithExpandedBlock = MakeFieldRequired<
  Transaction,
  "block" | "blobGasBaseFee"
>;

export type TransactionWithExpandedBlob = MakeFieldRequired<
  Transaction,
  "blobs"
>;

export type TransactionWithExpandedBlockAndBlob = MakeFieldRequired<
  Transaction,
  "blobs" | "block" | "blobGasBaseFee"
>;

type BlockExpandedTransactionWithExpandedBlobs = MakeFieldRequired<
  Required<Block["transactions"][number]>,
  "blobs"
>;

export type BlockWithExpandedTransactions = MakeFieldRequired<
  Block,
  "transactions"
>;

export type BlockWithExpandedBlobsAndTransactions = Omit<
  Block,
  "transactions"
> & {
  transactions: BlockExpandedTransactionWithExpandedBlobs[];
};
