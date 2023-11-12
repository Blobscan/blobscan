import type { Job } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

import type { BlobReplicationJobData } from "../types";

type DBBlobDataStorageReference = Parameters<
  typeof prisma.blobDataStorageReference.upsertMany
>[0][number];

export default async (job: Job<BlobReplicationJobData>) => {
  const blobWorkerResults = await job.getChildrenValues<BlobReference>();
  const versionedHash = job.data.versionedHash;

  const dbBlobStorageRefs = Object.values(
    blobWorkerResults
  ).map<DBBlobDataStorageReference>((result) => ({
    blobHash: versionedHash,
    blobStorage: result.storage,
    dataReference: result.reference,
  }));

  await prisma.blobDataStorageReference.upsertMany(dbBlobStorageRefs);
};
