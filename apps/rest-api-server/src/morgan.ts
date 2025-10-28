import logfmt from "logfmt";
import morgan from "morgan";

import { logger } from "@blobscan/logger";

const stream = {
  write: (message: string) => logger.http(message),
};

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (name: string, ...args: any[]) =>
      tokens[name]?.(req, res, ...args);

    return logfmt.stringify({
      ip: get("remote-addr"),
      method: get("method"),
      url: get("url"),
      status: get("status"),
      res_time: get("response-time") ? `${get("response-time")}ms` : undefined,
      res_length: get("res", "content-length") ?? "-",
    });
  },
  { stream }
);
