import type { BlobReplicationWorker } from "../types";
import { replicateBlob } from "../utils";

const postgresWorker: BlobReplicationWorker = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "POSTGRES", versionedHash);
};

export default postgresWorker;
