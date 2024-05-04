export class ErrorException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}

export class StatsSyncerError extends ErrorException {
  constructor(message: string, cause: unknown) {
    super(`Stats syncer failed: ${message}`, cause);
  }
}

export class PeriodicUpdaterError extends ErrorException {
  constructor(updaterName: string, message: string, cause: unknown) {
    super(`Updater "${updaterName}" failed: ${message}`, cause);
  }
}
