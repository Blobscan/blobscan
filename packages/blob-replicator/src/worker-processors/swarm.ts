import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "../utils";

const swarmWorker: BlobReplicationWorkerProcessor = (job) => {
  const { blobStorageRef, versionedHash } = job.data;

  return replicateBlob(blobStorageRef, "SWARM", versionedHash);
};

export default swarmWorker;
