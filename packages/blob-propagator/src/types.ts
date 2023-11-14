import type { Job, SandboxedJob } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";

export type Blob = {
  versionedHash: string;
  data: string;
};

export type BlobPropagationJobData = {
  versionedHash: string;
};

export type BlobPropagationSandboxedJob = SandboxedJob<BlobPropagationJobData>;

export type BlobPropagationJob = Job<BlobPropagationJobData>;

export type BlobPropagationWorkerProcessor = (
  job: BlobPropagationSandboxedJob
) => Promise<BlobReference>;
