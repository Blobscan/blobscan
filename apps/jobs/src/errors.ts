import { ErrorException } from "@blobscan/errors";
import type { ErrorCause } from "@blobscan/errors";

export class JobError extends ErrorException {
  constructor(jobName: string, message: string, cause: ErrorCause) {
    super(`Job "${jobName}" failed: ${message}`, cause);
  }
}
