import type { BlobReplicationWorker } from "../types";
import { replicateBlob } from "../utils";

const swarmWorker: BlobReplicationWorker = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "SWARM", versionedHash);
};

export default swarmWorker;
