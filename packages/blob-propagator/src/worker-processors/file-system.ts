import { getBlobStorageManager } from "@blobscan/blob-storage-manager";

import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const fileSystemProcessor: BlobPropagationWorkerProcessor = async (
  job
) => {
  const blobStorageManager = await getBlobStorageManager();

  return propagateBlob(job.data.versionedHash, "FILE_SYSTEM", {
    blobStorageManager,
  });
};
