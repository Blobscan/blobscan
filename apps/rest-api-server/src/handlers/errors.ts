import type { ErrorRequestHandler } from "express";

import { logger } from "@blobscan/logger";

import {
  isBodyParserError,
  PayloadTooLargeError,
} from "../errors/PayloadTooLargeError";
import { UnknownError } from "../errors/UnknownError";

export const errorHandler: ErrorRequestHandler = function (err, _, res, __) {
  if (isBodyParserError(err)) {
    return new PayloadTooLargeError(err).toJSONResponse(res);
  }

  const unknownErr = new UnknownError(err);

  logger.error(unknownErr);

  return unknownErr.toJSONResponse(res);
};
