import type { Response } from "express";

import { ErrorException } from "@blobscan/errors";

export const ERROR_CODES_BY_KEY = {
  INTERNAL_SERVER_ERROR: 500,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
};
type ValueOf<TObj> = TObj[keyof TObj];

export type ErrorCode = keyof typeof ERROR_CODES_BY_KEY;
export type ErrorStatus = ValueOf<typeof ERROR_CODES_BY_KEY>;

export class AppError extends ErrorException {
  public readonly code: ErrorCode;
  public readonly status: ErrorStatus;

  constructor(
    message: string,
    code: ErrorCode,
    opts?: Partial<{
      cause: Error;
      stack: string;
    }>
  ) {
    super(message, opts?.cause);

    this.code = code;
    this.status = ERROR_CODES_BY_KEY[code];
    this.stack = opts?.stack;
  }

  toJSONResponse(res: Response) {
    return res.status(this.status).json({
      code: this.code,
      message: this.message,
    });
  }
}
