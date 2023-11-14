import type { QueueOptions, WorkerOptions } from "bullmq";

import type { BlobStorage } from "@blobscan/db";

import { env } from "./env";

export const STORAGE_QUEUES: Record<BlobStorage, string> = {
  GOOGLE: "gcs-queue",
  SWARM: "swarm-queue",
  POSTGRES: "postgres-queue",
};

export const FINALIZER_QUEUE = "finalizer-queue";

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
  connection: {
    host: env.REDIS_QUEUE_HOST,
    port: env.REDIS_QUEUE_PORT,
    password: env.REDIS_QUEUE_PASSWORD,
    username: env.REDIS_QUEUE_USERNAME,
  },
};
