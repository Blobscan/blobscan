import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ temporaryBlobStorage: temporalBlobStorage }) =>
  async (job) => {
    const { stagingBlobUri } = job.data;

    await temporalBlobStorage.removeBlob(stagingBlobUri);
  };
