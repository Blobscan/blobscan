import type Bree from "bree";

export const jobs: (Bree.JobOptions | string)[] = [
  "backfill-daily-blob-stats",
  "backfill-daily-block-stats",
  "backfill-daily-transaction-stats",
];
