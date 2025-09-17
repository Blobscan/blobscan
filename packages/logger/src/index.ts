import winston from "winston";

import { z } from "@blobscan/zod";

export const logLevelEnum = z.enum(["error", "warn", "info", "http", "debug"]);

export type LoggerLevel = z.output<typeof logLevelEnum>;

function buildErrorCause(err: Error) {
  let msg = `\n - Cause: ${err.message}`;

  const cause = err.cause;
  if (cause instanceof Error || typeof cause === "string") {
    const errorCause = typeof cause === "string" ? new Error(cause) : cause;

    msg += buildErrorCause(errorCause);
  }

  return msg;
}

const colorFormat = winston.format.colorize({
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
    module: "blue",
  },
});

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, cause, module } = info;
    const formattedLevel = colorFormat.colorize(level, level.toUpperCase());
    const formattedModule = colorFormat.colorize("module", module ?? "app");
    const formattedMessage = colorFormat.colorize(level, message);

    let msg = `${timestamp} ${formattedLevel} ${formattedModule}: ${formattedMessage}`;

    if (cause instanceof Error) {
      msg += colorFormat.colorize(level, buildErrorCause(cause));
    }

    return msg;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format,
  transports: [new winston.transports.Console()],
  silent: process.env.MODE === "test",
});

export type Logger = typeof logger;
