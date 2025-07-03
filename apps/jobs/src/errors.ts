export class ErrorException extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;
  }
}
