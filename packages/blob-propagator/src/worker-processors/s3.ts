import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const s3Processor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, "S3", processorParams);
