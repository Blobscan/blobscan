import type { Job, Processor, Queue, Worker } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";

export type Blob = {
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
};

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationWorkerProcessor = Processor<
  BlobPropagationJobData,
  BlobReference
>;

export type BlobPropagationWorker = Worker<BlobPropagationJobData>;

export type BlobPropagationQueue = Queue<BlobPropagationJobData>;
