import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ stagingBlobStorage }) =>
  async (job) => {
    await stagingBlobStorage.removeBlob(job.data.stagedBlobUri);
  };
