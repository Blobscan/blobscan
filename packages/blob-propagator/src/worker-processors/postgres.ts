import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "./common";

const postgresWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "POSTGRES");
};

export default postgresWorker;
