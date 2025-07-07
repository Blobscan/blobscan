import type { Job } from "bullmq";

export type Granularity = "minute" | "hour" | "day";

export type EthPriceJobResult = {
  timestamp: string;
  price?: number;
  roundId?: string;
};

export type EthPriceJob = Job<{ granularity: Granularity }, EthPriceJobResult>;
