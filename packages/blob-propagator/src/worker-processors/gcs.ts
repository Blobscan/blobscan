import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const gcsWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "GOOGLE");
};
