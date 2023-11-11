import type { BlobReplicatorWorker } from "../types";
import { replicateBlob } from "../utils";

const gcsWorker: BlobReplicatorWorker = (job) => {
  const { originBlobStorageRef, versionedHash } = job.data;

  return replicateBlob(originBlobStorageRef, "GOOGLE", versionedHash);
};

export default gcsWorker;
