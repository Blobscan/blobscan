import type { JobsOptions, WorkerOptions } from "bullmq";

import { $Enums } from "@blobscan/db";

import { env } from "./env";

export const STORAGE_WORKER_NAMES = Object.values($Enums.BlobStorage).reduce<
  Record<$Enums.BlobStorage, string>
>(
  (names, storage) => ({
    ...names,
    [storage]: `${storage.toLowerCase()}-worker`,
  }),
  {} as Record<$Enums.BlobStorage, string>
);

export const FINALIZER_WORKER_NAME = "finalizer-worker";

export const DEFAULT_JOB_OPTIONS: Omit<JobsOptions, "repeat"> = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

export const DEFAULT_WORKER_OPTIONS: WorkerOptions = {
  autorun: true,
  useWorkerThreads: false,
  removeOnComplete: { age: env.BLOB_PROPAGATOR_COMPLETED_JOBS_AGE },
  removeOnFail: { age: env.BLOB_PROPAGATOR_FAILED_JOBS_AGE },
};
