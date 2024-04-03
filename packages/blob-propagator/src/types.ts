import type { Job, Processor, Queue, Worker } from "bullmq";

import type {
  BlobReference,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { BlobscanPrismaClient } from "@blobscan/db";

export type Blob = {
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
  tmpBlobStorageDataRef: BlobReference;
};

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationWorkerParams = {
  blobStorageManager: BlobStorageManager;
  prisma: BlobscanPrismaClient;
};

export type BlobPropagationWorkerProcessor = (
  params: BlobPropagationWorkerParams
) => Processor<BlobPropagationJobData, BlobReference>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
