import type { Job } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

import { removeBlobDataFile } from "../blob-data-file";
import type { BlobPropagationJobData } from "../types";

type DBBlobDataStorageReference = Parameters<
  typeof prisma.blobDataStorageReference.upsertMany
>[0][number];

export default async (job: Job<BlobPropagationJobData>) => {
  const finalizerOps = [];
  const blobWorkerResults = await job.getChildrenValues<BlobReference>();
  const versionedHash = job.data.versionedHash;

  /**
   * We can delete the blob data file as it was correctly propagated
   * across all enabled storages
   */
  finalizerOps.push(removeBlobDataFile(versionedHash));

  const dbBlobStorageRefs = Object.values(
    blobWorkerResults
  ).map<DBBlobDataStorageReference>((result) => ({
    blobHash: versionedHash,
    blobStorage: result.storage,
    dataReference: result.reference,
  }));

  finalizerOps.push(
    prisma.blobDataStorageReference.upsertMany(dbBlobStorageRefs)
  );

  return Promise.all(finalizerOps);
};
