import type { Response } from "express";

import { AppError } from "../AppError";

export class UnknownError extends AppError {
  constructor(err: unknown) {
    super(`Unexpected error: ${err}`, "INTERNAL_SERVER_ERROR");
  }

  toJSONResponse(res: Response): Response<unknown, Record<string, unknown>> {
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    });
  }
}
