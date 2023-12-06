import type { Job, Processor } from "bullmq";

import { blobFileManager } from "../blob-file-manager";
import type { BlobPropagationJobData } from "../types";

export const finalizerProcessor: Processor<BlobPropagationJobData, void> =
  async function (job: Job<BlobPropagationJobData>) {
    const versionedHash = job.data.versionedHash;

    /**
     * We can delete the blob data file as it was correctly propagated
     * across all enabled storages
     */
    await blobFileManager.removeFile(versionedHash);
  };
