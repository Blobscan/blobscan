import type { Job } from "bullmq";

export type OverallStatsJobResult =
  | {
      fromBlock: number;
      toBlock: number;
    }
  | undefined;

export type OverallStatsJob = Job<
  { forkSlot: number; batchSize?: number },
  OverallStatsJobResult
>;
