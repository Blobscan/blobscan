import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const swarmProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, processorParams);
