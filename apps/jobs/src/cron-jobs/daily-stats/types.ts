import type { SandboxedJob } from "bullmq";

export type DailyStatsJobResult =
  | {
      fromDate?: string;
      toDate: string;
      totalAggregationsCreated: number;
    }
  | undefined;

export type DailyStatsSanboxedJob = SandboxedJob<
  undefined,
  DailyStatsJobResult
>;
