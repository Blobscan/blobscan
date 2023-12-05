import type { Job } from "bullmq";

import { blobFileManager } from "../blob-file-manager";
import type { BlobPropagationJobData } from "../types";

export default async (job: Job<BlobPropagationJobData>) => {
  const versionedHash = job.data.versionedHash;

  /**
   * We can delete the blob data file as it was correctly propagated
   * across all enabled storages
   */
  await blobFileManager.removeBlobDataFile(versionedHash);
};
