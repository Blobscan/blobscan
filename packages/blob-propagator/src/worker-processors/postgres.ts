import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const postgresProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(job.data, processorParams);
