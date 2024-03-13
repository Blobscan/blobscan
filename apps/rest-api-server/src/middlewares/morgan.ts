import type { StreamOptions } from "morgan";
import morgan from "morgan";

import { logger } from "@blobscan/logger";

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  write: (message) =>
    logger.http(message.substring(0, message.lastIndexOf("\n"))),
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream }
);

export { morganMiddleware };
