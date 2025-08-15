import type { Job, Processor, Queue, Worker } from "bullmq";

import type {
  BlobReference,
  BlobStorage,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient } from "@blobscan/db";

export type BlobPropagationInput = {
  blockNumber?: number;
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
  stagingBlobUri: string;
};

export type BlobPropagationFinalizerJobData = {
  stagingBlobUri: string;
};

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationFinalizerJob = Job<BlobPropagationFinalizerJobData>;

export type BlobPropagationWorkerParams = {
  blobStorageManager: BlobStorageManager;
  prisma: BlobscanPrismaClient;
  temporaryBlobStorage: BlobStorage;
};

export type BlobPropagationFinalizerWorkerParams = {
  temporaryBlobStorage: BlobStorage;
};

export type BlobPropagationWorkerProcessor = (
  params: BlobPropagationWorkerParams
) => Processor<BlobPropagationJobData, BlobReference>;

export type BlobPropagationFinalizerWorkerProcessor = (
  params: BlobPropagationFinalizerWorkerParams
) => Processor<BlobPropagationFinalizerJobData>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
