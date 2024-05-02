import winston from "winston";

import { env } from "./env";

function buildErrorCause(err: Error) {
  let msg = ` - Cause: ${err.message}`;

  if (err.cause instanceof Error) {
    msg += buildErrorCause(err.cause);
  }

  return msg;
}
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

const colorFormat = winston.format.colorize();

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(({ timestamp, level, message, cause }) => {
    let msg = `${timestamp} ${colorFormat.colorize(
      level,
      level
    )}: ${colorFormat.colorize(level, message)}`;

    if (cause instanceof Error) {
      msg += colorFormat.colorize(level, buildErrorCause(cause));
    }

    return msg;
  })
);

winston.addColors(colors);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format,
  transports: [new winston.transports.Console()],
  silent: env.TEST,
});

export type Logger = typeof logger;

export type LoggerLevel = "error" | "warn" | "info" | "debug";
