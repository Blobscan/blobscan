import type { Processor } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";

export type Blob = {
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
};

export type BlobPropagationWorkerProcessor = Processor<
  BlobPropagationJobData,
  BlobReference
>;
