import morgan from "morgan";

import { logger } from "@blobscan/logger";

const stream = {
  write: (message: string) => {
    try {
      const parsed = JSON.parse(message);
      logger.http("HTTP request handled", parsed);
    } catch {
      logger.http(message.trim());
    }
  },
};

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (name: string, ...args: any[]) =>
      tokens[name]?.(req, res, ...args);

    const data: Record<string, string> = {};

    const ip = get("remote-addr");
    const method = get("method");
    const url = get("url");
    const status = get("status");
    const responseTime = get("response-time");
    const contentLength = get("res", "content-length");

    if (ip) {
      data.ip = ip;
    }

    if (method) {
      data.method = method;
    }

    if (url) {
      data.url = url;
    }

    if (status) {
      data.status = status;
    }

    if (responseTime) {
      data.res_time = `${responseTime}ms`;
    }

    if (contentLength) {
      data.res_length = contentLength;
    }

    return JSON.stringify(data);
  },
  { stream }
);
