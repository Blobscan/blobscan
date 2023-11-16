import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

const postgresWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "POSTGRES");
};

export default postgresWorker;
