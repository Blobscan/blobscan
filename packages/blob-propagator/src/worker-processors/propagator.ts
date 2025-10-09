import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const blobPropagatorProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, processorParams);
