import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "../utils";

const postgresWorker: BlobReplicationWorkerProcessor = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "POSTGRES", versionedHash);
};

export default postgresWorker;
