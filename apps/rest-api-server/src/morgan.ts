import morgan from "morgan";

import { logger } from "@blobscan/logger";

const stream = {
  write: (message: string) => logger.http(message),
};

export const morganMiddleware = morgan("short", { stream });
