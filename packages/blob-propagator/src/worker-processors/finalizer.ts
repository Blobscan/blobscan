import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ temporaryBlobStorage: temporalBlobStorage }) =>
  async (job) => {
    const { temporaryBlobUri } = job.data;

    await temporalBlobStorage.removeBlob(temporaryBlobUri);
  };
