import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ incomingBlobStorage }) =>
  async (job) => {
    await incomingBlobStorage.removeBlob(job.data.incomingBlobUri);
  };
