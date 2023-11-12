import type { BlobReplicationWorker } from "../types";
import { replicateBlob } from "../utils";

const gcsWorker: BlobReplicationWorker = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "GOOGLE", versionedHash);
};

export default gcsWorker;
