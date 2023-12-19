import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const gcsProcessor: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "GOOGLE");
};
