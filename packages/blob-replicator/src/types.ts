import type { Job, SandboxedJob } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";

export type Blob = {
  versionedHash: string;
  data: string;
};

export type BlobReplicationJobData = {
  versionedHash: string;
};

export type BlobReplicationSandboxedJob = SandboxedJob<BlobReplicationJobData>;

export type BlobReplicationJob = Job<BlobReplicationJobData>;

export type BlobReplicationWorkerProcessor = (
  job: BlobReplicationSandboxedJob
) => Promise<BlobReference>;
