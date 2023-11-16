import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

const gcsWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "GOOGLE");
};

export default gcsWorker;
