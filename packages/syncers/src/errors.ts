import { ErrorException } from "@blobscan/errors";
import type { ErrorCause } from "@blobscan/errors";

export class SyncerError extends ErrorException {
  constructor(syncerName: string, message: string, cause: ErrorCause) {
    super(`Syncer "${syncerName}" failed: ${message}`, cause);
  }
}
