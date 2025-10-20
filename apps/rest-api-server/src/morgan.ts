import logfmt from "logfmt";
import morgan from "morgan";

import { logger } from "@blobscan/logger";

const stream = {
  write: (message: string) => logger.http(message),
};

const logfmtFormat = (tokens: any, req: any, res: any) => {
  const logData = {
    ip: tokens["remote-addr"](req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    res_time: `${tokens["response-time"](req, res)}ms`,
    res_length: tokens.res(req, res, "content-length") || "-",
    level: "http",
  };

  return logfmt.stringify(logData);
};

export const morganMiddleware = morgan(logfmtFormat, { stream });
