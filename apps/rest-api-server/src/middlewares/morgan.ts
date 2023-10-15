import type { StreamOptions } from "morgan";
import morgan from "morgan";

import { logger } from "@blobscan/logger";

import { env } from "../env";

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  write: (message) =>
    logger.http(message.substring(0, message.lastIndexOf("\n"))),
};

const skip = () => {
  const node_env = env.NODE_ENV || "development";
  return node_env !== "development";
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);

export { morganMiddleware };
