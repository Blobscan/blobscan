import type { FlowProducer, Job, Processor, Queue, Worker } from "bullmq";

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

export type BlobPropagationFinalizerJobData = {
  blobUri: string;
};

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationFinalizerJob = Job<BlobPropagationFinalizerJobData>;

export type BlobPropagationWorkerParams = {
  targetBlobStorage: BlobStorage;
  prisma: BlobscanPrismaClient;
  primaryBlobStorage: BlobStorage;
};

export type BlobPropagationFinalizerWorkerParams = {
  primaryBlobStorage: BlobStorage;
};

export type Reconciliator = {
  queue: Queue<null>;
  worker: Worker<null, ReconciliatorProcessorResult>;
};

export type ReconciliatorProcessorParams = {
  flowProducer: FlowProducer;
  prisma: BlobscanPrismaClient;
  primaryBlobStorage: BlobStorage;
  batchSize: number;
  storageWorkerNames: string[];
  finalizerWorkerName: string;
};

export type ReconciliatorProcessorResult = {
  flowsCreated: number;
  blobTimestamps?: { firstBlob?: Date; lastBlob?: Date };
};

export type ReconciliatorProcessor = (
  params: ReconciliatorProcessorParams
) => Processor<null, ReconciliatorProcessorResult>;

export type BlobPropagationWorkerProcessor = (
  params: BlobPropagationWorkerParams
) => Processor<BlobPropagationJobData, BlobReference>;

export type BlobPropagationFinalizerWorkerProcessor = (
  params: BlobPropagationFinalizerWorkerParams
) => Processor<BlobPropagationFinalizerJobData>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
