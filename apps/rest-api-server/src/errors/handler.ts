import type { ErrorRequestHandler } from "express";

import { logger } from "@blobscan/logger";

import {
  isBodyParserError,
  PayloadTooLargeError,
} from "./app-errors/PayloadTooLargeError";
import { UnknownError } from "./app-errors/UnknownError";

export const errorHandler: ErrorRequestHandler = function (err, _, res, __) {
  if (isBodyParserError(err)) {
    const payloadError = new PayloadTooLargeError(err);

    logger.error(payloadError);

    return res.status(payloadError.status).json({
      code: "PAYLOAD_TOO_LARGE",
      message: `Request body exceeds limit`,
    });
  }

  const unknownErr = new UnknownError(err);

  logger.error(unknownErr);

  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal Server Error",
  });
};
