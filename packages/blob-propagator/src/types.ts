import type { Job, Processor, Queue, Worker } from "bullmq";

import type {
  BlobReference,
  BlobStorage,
} from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient } from "@blobscan/db";

export type BlobPropagationInput = {
  blockNumber?: number;
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
  blobUri: string;
};

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationWorkerParams = {
  targetBlobStorage: BlobStorage;
  prisma: BlobscanPrismaClient;
  primaryBlobStorage: BlobStorage;
};

export type PropagationQueue = Queue<BlobPropagationJobData>;

export type StoragePropagator = {
  queue: PropagationQueue;
  worker: Worker<BlobPropagationJobData>;
};

export type Reconciler = {
  queue: Queue<null>;
  worker: Worker<null, ReconcilerProcessorResult>;
};

export type ReconcilerProcessorParams = {
  prisma: BlobscanPrismaClient;
  primaryBlobStorage: BlobStorage;
  batchSize: number;
  propagatorQueues: PropagationQueue[];
  highestBlockNumber?: number;
};

export type ReconcilerProcessorResult = {
  jobsCreated: number;
  blobTimestamps?: { firstBlob?: Date; lastBlob?: Date };
};

export type ReconcilerProcessor = (
  params: ReconcilerProcessorParams
) => Processor<null, ReconcilerProcessorResult>;

export type BlobPropagationWorkerProcessor = (
  params: BlobPropagationWorkerParams
) => Processor<BlobPropagationJobData, BlobReference>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
