import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const chunkstormProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, "CHUNKSTORM", processorParams);
