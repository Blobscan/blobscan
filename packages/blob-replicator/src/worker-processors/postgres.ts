import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "./common";

const postgresWorker: BlobReplicationWorkerProcessor = (job) => {
  return replicateBlob(job.data.versionedHash, "POSTGRES");
};

export default postgresWorker;
