import type { AppRouterInputs, AppRouterOutputs } from "@blobscan/api";
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

export type TimeseriesData = AppRouterOutputs["stats"]["getTimeseries"]["data"];

export type SingleTimeseries = TimeseriesData["series"][number];

export type TimeseriesMetricsSeries =
  TimeseriesData["series"][number]["metrics"];

export type TimeseriesMetric = keyof TimeseriesMetricsSeries;

export type TimeseriesName = Category | Rollup | "global";

export type OverallStats = AppRouterOutputs["stats"]["getOverallStats"][number];

export type SearchOutput = NonNullable<AppRouterOutputs["search"]>;

export type SearchCategory = keyof SearchOutput;

export type AppState = AppRouterOutputs["state"]["getAppState"];

export type GetAdjacentTxByAddressInput =
  AppRouterInputs["tx"]["getAdjacentsByAddress"];
