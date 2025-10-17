import type { ErrorCause } from "./types";

export class ErrorException extends Error {
  constructor(message: string, cause?: ErrorCause) {
    super(message, {
      cause,
    });

    this.name = this.constructor.name;

    // Redefine `cause` as enumerable so Winston includes it in logged output
    Object.defineProperty(this, "cause", {
      value: this.cause,
      enumerable: true,
    });
  }
}
