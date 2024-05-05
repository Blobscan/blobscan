import winston from "winston";

import { env } from "./env";

function buildErrorCause(err: Error) {
  let msg = ` - Cause: ${err.message}`;

  if (err.cause instanceof Error) {
    msg += buildErrorCause(err.cause);
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

function createLogger(opts: winston.LoggerOptions = {}) {
  return winston.createLogger({
    level: env.LOG_LEVEL,
    format,
    transports: [new winston.transports.Console()],
    silent: env.TEST,
    ...opts,
  });
}

export const logger = createLogger();

export function createModuleLogger(...moduleParts: string[]) {
  const module = moduleParts.join(":");

  return createLogger({
    defaultMeta: { module },
  });
}

export type Logger = typeof logger;

export type LoggerLevel = "error" | "warn" | "info" | "debug";
