import type { Job } from "bullmq";

export type SwarmStampJobResult = {
  batchId: string;
  newExpirationDate: string;
};

export type SwarmStampJob = Job<
  { beeEndpoint: string; batchId: string },
  SwarmStampJobResult
>;
