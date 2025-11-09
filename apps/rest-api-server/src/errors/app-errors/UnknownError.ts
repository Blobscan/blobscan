import { AppError } from "../AppError";

export class UnknownError extends AppError {
  constructor(err: unknown) {
    super(`Unexpected error: ${err}`, "INTERNAL_SERVER_ERROR");
  }
}
