import type { AppRouterOutputs } from "@blobscan/api/web";
import type {
  BlobStorage as BlobStorageEnum,
  Rollup as RollupEnum,
  Category as CategoryEnum,
} from "@blobscan/db/prisma/enums";

import type { MakeRequired } from "./helpers";

export type BlobStorage = Lowercase<BlobStorageEnum>;

export type Rollup = Lowercase<RollupEnum>;

export type Category = Lowercase<CategoryEnum>;

export type Blob = AppRouterOutputs["blob"]["getByBlobId"];

export type BlobOnTransaction =
  AppRouterOutputs["blob"]["getAll"]["blobs"][number];

export type Block = AppRouterOutputs["block"]["getByBlockId"];

export type Transaction = AppRouterOutputs["tx"]["getByHash"];

export type TransactionWithExpandedBlock = MakeRequired<Transaction, "block">;

export type TransactionWithExpandedBlob = MakeRequired<Transaction, "blobs">;

export type TransactionWithExpandedBlockAndBlob = MakeRequired<
  Transaction,
  "blobs" | "block"
>;

type BlockExpandedTransactionWithExpandedBlobs = MakeRequired<
  Required<Block["transactions"][number]>,
  "blobs"
>;

export type BlockWithExpandedTransactions = MakeRequired<Block, "transactions">;

export type BlockWithExpandedBlobsAndTransactions = Omit<
  Block,
  "transactions"
> & {
  transactions: BlockExpandedTransactionWithExpandedBlobs[];
};

export type BlobWithExpandedTransaction = MakeRequired<
  BlobOnTransaction,
  "transaction"
>;

export type DailyStats = AppRouterOutputs["stats"]["getDailyStats"][number];

export type DailyStatName = keyof Omit<
  DailyStats,
  "day" | "category" | "rollup"
>;

export type OverallStats = AppRouterOutputs["stats"]["getOverallStats"][number];

export type SearchResults = AppRouterOutputs["search"]["byTerm"];
