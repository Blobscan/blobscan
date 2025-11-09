import { AppError } from "../AppError";

interface BodyParserError extends Error {
  status: number;
  type: string;
  expected: number;
  length: number;
  limit: number;
}

export function isBodyParserError(err: unknown): err is BodyParserError {
  if (!err || typeof err !== "object") return false;

  const e = err as Partial<BodyParserError>;

  return (
    typeof e.status === "number" &&
    typeof e.message === "string" &&
    typeof e.type === "string" &&
    typeof e.expected === "number" &&
    typeof e.length === "number" &&
    typeof e.limit === "number"
  );
}

export class PayloadTooLargeError extends AppError {
  constructor(err: BodyParserError) {
    super(
      `Request entity too large: got ${err.length} but limit is ${err.limit}`,
      "PAYLOAD_TOO_LARGE",
      {
        stack: err.stack,
      }
    );
  }
}
