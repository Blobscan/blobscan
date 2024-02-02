import { getBlobStorageManager } from "@blobscan/blob-storage-manager";

import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const postgresProcessor: BlobPropagationWorkerProcessor = async (
  job
) => {
  const blobStorageManager = await getBlobStorageManager();

  return propagateBlob(job.data.versionedHash, "POSTGRES", {
    blobStorageManager,
  });
};
