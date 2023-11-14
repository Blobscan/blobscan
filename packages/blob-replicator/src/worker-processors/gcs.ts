import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "./common";

const gcsWorker: BlobReplicationWorkerProcessor = (job) => {
  return replicateBlob(job.data.versionedHash, "GOOGLE");
};

export default gcsWorker;
