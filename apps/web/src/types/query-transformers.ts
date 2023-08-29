import type {
  OverallBlobStats,
  OverallTxStats,
  SingleDailyBlobStats,
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

export type TransformToArray<T> = {
  [K in keyof T]: T[K][];
};

export type TransformedOverallBlobStats = Omit<
  NonNullable<OverallBlobStats>,
  "totalBlobSize" | "updatedAt"
> & { totalBlobSize: bigint } & OptionalDate;

export type TransformedOverallTxStats = Omit<
  NonNullable<OverallTxStats>,
  "updatedAt"
> &
  OptionalDate;

export type TransformedDailyTransactionStats = {
  days: string[];
  transactions: SingleDailyTransactionStats["totalTransactions"][];
  uniqueReceivers: SingleDailyTransactionStats["totalUniqueReceivers"][];
  uniqueSenders: SingleDailyTransactionStats["totalUniqueSenders"][];
};
