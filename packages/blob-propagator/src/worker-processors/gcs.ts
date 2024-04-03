import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const gcsProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, "GOOGLE", processorParams);
