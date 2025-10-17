import type { ErrorCause } from "@blobscan/errors";
import { ErrorException } from "@blobscan/errors";

export class BlobPropagatorError extends ErrorException {
  constructor(message: string, cause: ErrorCause) {
    super(`Blob propagator failed: ${message}`, cause);
  }
}

export class BlobPropagatorCreationError extends BlobPropagatorError {
  constructor(cause: ErrorCause) {
    super("Failed to create blob propagator", cause);
  }
}
