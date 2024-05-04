type ErrorCause = Error | string;

export class ErrorException extends Error {
  constructor(message: string, cause?: ErrorCause) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}

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

export class BlobPropagatorWorkerError extends BlobPropagatorError {
  constructor(workerName: string, jobId: string, cause: ErrorCause) {
    super(`Worker ${workerName} failed: Job ${jobId} failed`, cause);
  }
}
