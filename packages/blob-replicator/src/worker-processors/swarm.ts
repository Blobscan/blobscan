import type { BlobReplicationWorkerProcessor } from "../types";
import { replicateBlob } from "./common";

const swarmWorker: BlobReplicationWorkerProcessor = (job) => {
  return replicateBlob(job.data.versionedHash, "SWARM");
};

export default swarmWorker;
