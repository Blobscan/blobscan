import type { JobsOptions, WorkerOptions } from "bullmq";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

export const STORAGE_WORKER_NAMES = Object.values(BlobStorageName)
  .filter((blobStorageName) => blobStorageName !== "WEAVEVM")
  .reduce<Record<BlobStorageName, string>>(
    (names, storage) => ({
      ...names,
      [storage]: `${storage.toLowerCase()}-worker`,
    }),
    {} as Record<BlobStorageName, string>
  );

export const RECONCILER_WORKER_NAME = "reconciler-worker";

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
  removeOnComplete: { age: 24 * 60 * 60 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};
