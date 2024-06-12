export class ErrorException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}

export class SyncerError extends ErrorException {
  constructor(syncerName: string, message: string, cause: unknown) {
    super(`Syncer "${syncerName}" failed: ${message}`, cause);
  }
}
