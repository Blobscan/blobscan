export class ErrorException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}

export class SwarmStampSyncerError extends ErrorException {
  constructor(message: string) {
    super(`Stats syncer failed: ${message}`);
  }
}

export class PeriodicUpdaterError extends ErrorException {
  constructor(updaterName: string, message: string, cause: unknown) {
    super(`Updater "${updaterName}" failed: ${message}`, cause);
  }
}
