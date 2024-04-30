import type { JobsOptions, WorkerOptions } from "bullmq";

import { $Enums } from "@blobscan/db";

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
  removeOnComplete: { count: 1000 },
};
