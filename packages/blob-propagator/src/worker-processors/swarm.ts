import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "./common";

const swarmWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "SWARM");
};

export default swarmWorker;
