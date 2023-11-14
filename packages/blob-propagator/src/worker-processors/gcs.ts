import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "./common";

const gcsWorker: BlobPropagationWorkerProcessor = (job) => {
  return propagateBlob(job.data.versionedHash, "GOOGLE");
};

export default gcsWorker;
