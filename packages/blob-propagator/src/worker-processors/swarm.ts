import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

const swarmWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "SWARM");
};

export default swarmWorker;
