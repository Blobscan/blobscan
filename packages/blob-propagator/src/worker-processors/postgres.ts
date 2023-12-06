import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const postgresWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "POSTGRES");
};
