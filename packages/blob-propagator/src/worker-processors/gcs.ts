import type { BlobPropagationWorkerProcessor } from "../types";
import { propagateBlob } from "../utils";

export const gcsProcessor: BlobPropagationWorkerProcessor =
  (processorParams) => (job) =>
    propagateBlob(
      {
        ...job.data,
        // TODO: Temporary hard-coded mode.
        blobRetentionMode: "eager",
      },
      "GOOGLE",
      processorParams
    );
