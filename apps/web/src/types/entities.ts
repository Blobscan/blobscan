import type {
  BlobStorage as BlobStorageEnum,
  Rollup as RollupEnum,
  Category as CategoryEnum,
} from "@blobscan/api/enums";

import type { MakeFieldRequired } from "./helpers";
import type {
  GetAllBlobsOutput,
  GetByBlobIdOutput,
  GetByBlockIdOutput,
  GetTxByHashOutput,
} from "./routers";

export type BlobStorage = Lowercase<BlobStorageEnum>;

export type Rollup = Lowercase<RollupEnum>;

export type Category = Lowercase<CategoryEnum>;

export type Blob = GetByBlobIdOutput;

export type BlobOnTransaction = GetAllBlobsOutput["blobs"][number];

export type Block = GetByBlockIdOutput;

export type Transaction = GetTxByHashOutput;

export type TransactionWithExpandedBlock = MakeFieldRequired<
  Transaction,
  "block"
>;

export type TransactionWithExpandedBlob = MakeFieldRequired<
  Transaction,
  "blobs"
>;

export type TransactionWithExpandedBlockAndBlob = MakeFieldRequired<
  Transaction,
  "blobs" | "block"
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

export type BlobWithExpandedTransaction = MakeFieldRequired<
  BlobOnTransaction,
  "transaction"
>;
