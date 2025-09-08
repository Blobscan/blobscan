import type { JobsOptions, WorkerOptions } from "bullmq";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";

export const STORAGE_WORKER_NAMES = Object.values(BlobStorageName)
  .filter((blobStorageName) => blobStorageName !== "WEAVEVM")
  .reduce<Record<BlobStorageName, string>>(
    (names, storage) => ({
      ...names,
      [storage]: `${storage.toLowerCase()}-worker`,
    }),
    {} as Record<BlobStorageName, string>
  );

export const RECONCILIER_WORKER_NAME = "reconcilier-worker";

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
