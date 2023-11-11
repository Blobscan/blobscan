import type { QueueOptions } from "bullmq";

import type { BlobStorage } from "@blobscan/db";

export const STORAGE_QUEUES: Record<BlobStorage, string> = {
  GOOGLE: "gcs",
  SWARM: "swarm",
  POSTGRES: "postgres",
};

export const FLOW_PRODUCER_QUEUE = "propagator-flow-producer";

export const DEFAULT_OPTIONS: QueueOptions = {
  defaultJobOptions: {
    backoff: {
      type: "exponential",
    },
    attempts: 3,
    removeOnComplete: true,
  },
};
