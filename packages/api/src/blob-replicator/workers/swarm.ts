import type { BlobReplicatorWorker } from "../types";
import { replicateBlob } from "../utils";

const swarmWorker: BlobReplicatorWorker = (job) => {
  const { originBlobStorageRef, versionedHash } = job.data;

  return replicateBlob(originBlobStorageRef, "SWARM", versionedHash);
};

export default swarmWorker;
