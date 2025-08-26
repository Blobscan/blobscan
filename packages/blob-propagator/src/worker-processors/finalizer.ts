import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ primaryBlobStorage: incomingBlobStorage }) =>
  async (job) => {
    await incomingBlobStorage.removeBlob(job.data.blobUri);
  };
