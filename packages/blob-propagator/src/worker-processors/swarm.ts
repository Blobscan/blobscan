import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const swarmWorker: BlobPropagationWorkerProcessor = function (job) {
  return propagateBlob(job.data.versionedHash, "SWARM");
};
