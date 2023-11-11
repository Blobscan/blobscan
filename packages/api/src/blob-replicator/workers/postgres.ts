import type { BlobReplicatorWorker } from "../types";
import { replicateBlob } from "../utils";

const postgresWorker: BlobReplicatorWorker = (job) => {
  const { originBlobStorageRef, versionedHash } = job.data;

  return replicateBlob(originBlobStorageRef, "POSTGRES", versionedHash);
};

export default postgresWorker;
