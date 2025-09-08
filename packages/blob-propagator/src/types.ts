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

export type Reconcilier = {
  queue: Queue<null>;
  worker: Worker<null, ReconcilierProcessorResult>;
};

export type ReconcilierProcessorParams = {
  prisma: BlobscanPrismaClient;
  primaryBlobStorage: BlobStorage;
  batchSize: number;
  propagatorQueues: PropagationQueue[];
  highestBlockNumber?: number;
};

export type ReconcilierProcessorResult = {
  jobsCreated: number;
  blobTimestamps?: { firstBlob?: Date; lastBlob?: Date };
};

export type ReconcilierProcessor = (
  params: ReconcilierProcessorParams
) => Processor<null, ReconcilierProcessorResult>;

export type BlobPropagationWorkerProcessor = (
  params: BlobPropagationWorkerParams
) => Processor<BlobPropagationJobData, BlobReference>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
