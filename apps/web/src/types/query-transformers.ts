import type {
  OverallBlobStats,
  OverallBlockStats,
  OverallTxStats,
  SingleDailyBlobStats,
  SingleDailyBlockStats,
  SingleDailyTransactionStats,
} from "./routers";

export type OptionalDate = {
  updatedAt?: Date;
};

export type TRPCResult<T> = {
  isLoading: boolean;
  data?: T | undefined;
};

export type TransformedDailyBlobStats = {
  days: string[];
  blobs: SingleDailyBlobStats["totalBlobs"][];
  uniqueBlobs: SingleDailyBlobStats["totalUniqueBlobs"][];
  blobSizes: number[];
  avgBlobSizes: SingleDailyBlobStats["avgBlobSize"][];
};

export type TransformedDailyBlockStats = {
  days: string[];
  blocks: SingleDailyBlockStats["totalBlocks"][];
};

export type TransformedOverallBlobStats = Omit<
  NonNullable<OverallBlobStats>,
  "totalBlobSize" | "updatedAt"
> & { totalBlobSize: bigint } & OptionalDate;

export type TransformedOverallBlockStats = Omit<
  NonNullable<OverallBlockStats>,
  "updatedAt"
> &
  OptionalDate;

export type TransformedOverallTxStats = Omit<
  NonNullable<OverallTxStats>,
  "updatedAt"
> &
  OptionalDate;

export type TransformAllOverallStats = {
  blob: TransformedOverallBlobStats;
  block: TransformedOverallBlockStats;
  transaction: TransformedOverallTxStats;
};

export type TransformedDailyTransactionStats = {
  days: string[];
  transactions: SingleDailyTransactionStats["totalTransactions"][];
  uniqueReceivers: SingleDailyTransactionStats["totalUniqueReceivers"][];
  uniqueSenders: SingleDailyTransactionStats["totalUniqueSenders"][];
};
