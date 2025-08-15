import type { BlobPropagationFinalizerWorkerProcessor } from "../types";

export const finalizerProcessor: BlobPropagationFinalizerWorkerProcessor =
  ({ stagingBlobStorage }) =>
  async (job) => {
    const { stagingBlobUri } = job.data;

    await stagingBlobStorage.removeBlob(stagingBlobUri);
  };
