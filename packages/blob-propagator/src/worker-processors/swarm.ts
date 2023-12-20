import { getBlobStorageManager } from "@blobscan/blob-storage-manager";

import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const swarmProcessor: BlobPropagationWorkerProcessor = async function (
  job
) {
  const blobStorageManager = await getBlobStorageManager();

  return propagateBlob(job.data.versionedHash, "SWARM", { blobStorageManager });
};
