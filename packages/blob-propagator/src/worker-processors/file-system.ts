import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const fileSystemProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, "FILE_SYSTEM", processorParams);
