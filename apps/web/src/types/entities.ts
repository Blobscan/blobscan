import type { RouterOutputs } from "@blobscan/api";
import type {
  BlobStorage as BlobStorageEnum,
  Rollup as RollupEnum,
  Category as CategoryEnum,
} from "@blobscan/api/enums";

import type { EChartCompliant, MakeFieldRequired } from "./helpers";

export type BlobStorage = Lowercase<BlobStorageEnum>;

export type Rollup = Lowercase<RollupEnum>;

export type Category = Lowercase<CategoryEnum>;

export type Blob = RouterOutputs["blob"]["getByBlobId"];

export type BlobOnTransaction =
  RouterOutputs["blob"]["getAll"]["blobs"][number];

export type Block = RouterOutputs["block"]["getByBlockId"];

export type Transaction = RouterOutputs["tx"]["getByHash"];

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

export type DailyStats = RouterOutputs["stats"]["getDailyStats"][number];

export type OverallStats = RouterOutputs["stats"]["getOverallStats"];

export type EChartCompliantDailyStats = EChartCompliant<DailyStats>;

export type EChartCompliantOverallStats = EChartCompliant<OverallStats>;
