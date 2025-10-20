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

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  http: 2,
  info: 3,
  debug: 4,
};

const colorFormat = winston.format.colorize({
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
    service: "blue",
  },
});

const format = winston.format.combine(
  winston.format.errors({ cause: true, stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, cause, service } = info;

    const formattedLevel = colorFormat.colorize(level, level.toUpperCase());
    const formattedService =
      typeof service === "string"
        ? colorFormat.colorize("service", service ?? "app")
        : "";
    const formattedMessage =
      typeof message === "string"
        ? colorFormat.colorize(level, message)
        : message;

    let msg = `${timestamp} ${formattedLevel} ${formattedService}: ${formattedMessage}`;

    if (cause instanceof Error) {
      msg += colorFormat.colorize(level, buildErrorCause(cause));
    }

    return msg;
  })
);

export function createLogger(name?: string, opts: winston.LoggerOptions = {}) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    levels: LOG_LEVELS,
    format,
    transports: [new winston.transports.Console()],
    silent: process.env.MODE === "test",
    ...opts,
    defaultMeta: {
      ...opts.defaultMeta,
      ...(name ? { service: name } : {}),
    },
  });
}

export const logger = createLogger();

export async function perfOperation<T>(
  operation: () => T
): Promise<[Awaited<T>, number]> {
  const p0 = performance.now();

  const res = await operation();

  const p1 = performance.now();

  return [res, Number((p1 - p0).toFixed(2))];
}

export type Logger = typeof logger;
