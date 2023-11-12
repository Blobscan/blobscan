import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "../utils";

const gcsWorker: BlobReplicationWorkerProcessor = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "GOOGLE", versionedHash);
};

export default gcsWorker;
