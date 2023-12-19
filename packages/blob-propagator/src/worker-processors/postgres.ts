import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const postgresProcessor: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "POSTGRES");
};
