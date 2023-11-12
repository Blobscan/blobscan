import type { Job, SandboxedJob } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";

export type BlobReplicationJobData = {
  blobStorageRef: BlobReference;
  versionedHash: string;
};

export type BlobReplicationSandboxedJob = SandboxedJob<BlobReplicationJobData>;

export type BlobReplicationJob = Job<BlobReplicationJobData>;

export type BlobReplicationWorker = (
  job: BlobReplicationSandboxedJob
) => Promise<BlobReference>;
