import type { QueueOptions, WorkerOptions } from "bullmq";

import type { BlobStorage } from "@blobscan/db";

export const STORAGE_QUEUES: Record<BlobStorage, string> = {
  GOOGLE: "gcs",
  SWARM: "swarm",
  POSTGRES: "postgres",
};

export const STORAGE_REFS_COLLECTOR_QUEUE = "blob-storage-refs-collector";

export const DEFAULT_OPTIONS: QueueOptions = {
  defaultJobOptions: {
    backoff: {
      type: "exponential",
    },
    attempts: 3,
    removeOnComplete: true,
  },
};

export const DEFAULT_WORKER_OPTIONS: WorkerOptions = {
  useWorkerThreads: true,
};
