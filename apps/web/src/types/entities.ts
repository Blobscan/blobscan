import type { RouterOutputs } from "@blobscan/api";
import type {
  BlobStorage as BlobStorageEnum,
  Rollup as RollupEnum,
  Category as CategoryEnum,
} from "@blobscan/api/enums";

import type { EChartCompliant, MakeRequired } from "./helpers";

export type BlobStorage = Lowercase<BlobStorageEnum>;

export type Rollup = Lowercase<RollupEnum>;

export type Category = Lowercase<CategoryEnum>;

export type Blob = RouterOutputs["blob"]["getByBlobId"];

export type BlobOnTransaction =
  RouterOutputs["blob"]["getAll"]["blobs"][number];

export type Block = RouterOutputs["block"]["getByBlockId"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

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

export type DailyStats = RouterOutputs["stats"]["getDailyStats"][number];

export type DailyStatName = keyof Omit<
  DailyStats,
  "day" | "category" | "rollup"
>;

export type OverallStats = RouterOutputs["stats"]["getOverallStats"][number];

export type EChartCompliantDailyStats = EChartCompliant<DailyStats>;

export type EChartCompliantOverallStats = EChartCompliant<OverallStats>;
