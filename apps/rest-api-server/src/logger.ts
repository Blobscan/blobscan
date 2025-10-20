import winston from "winston";

import { z } from "@blobscan/zod";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logfmt = require("logfmt");

export const logLevelEnum = z.enum(["error", "warn", "info", "http", "debug"]);

export type LoggerLevel = z.output<typeof logLevelEnum>;

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  http: 2,
  info: 3,
  debug: 4,
};

// Logfmt formatter for Winston
const logfmtFormat = winston.format.combine(
  winston.format.errors({ cause: true, stack: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;

    const logData: Record<string, string | number | boolean> = {
      ts: String(timestamp),
      level: level.toUpperCase(),
      message: typeof message === "string" ? message : JSON.stringify(message),
    };

    if (typeof service === "string") {
      logData.service = service;
    }

    // Add any additional metadata
    Object.keys(meta).forEach((key) => {
      const value = meta[key];
      if (value !== undefined && key !== "cause") {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          logData[key] = value;
        } else {
          logData[key] = JSON.stringify(value);
        }
      }
    });

    // Handle error causes
    if (info.cause instanceof Error) {
      logData.error_cause = info.cause.message;
      if (info.cause.stack) {
        logData.error_stack = info.cause.stack;
      }
    }

    return logfmt.stringify(logData);
  })
);

export function createLogger(name?: string, opts: winston.LoggerOptions = {}) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    levels: LOG_LEVELS,
    format: logfmtFormat,
    transports: [new winston.transports.Console()],
    silent: process.env.MODE === "test",
    ...opts,
    defaultMeta: {
      ...opts.defaultMeta,
      ...(name ? { service: name } : {}),
    },
  });
}

export const logger = createLogger("rest-api-server");

export async function perfOperation<T>(
  operation: () => T
): Promise<[Awaited<T>, number]> {
  const p0 = performance.now();

  const res = await operation();

  const p1 = performance.now();

  return [res, Number((p1 - p0).toFixed(2))];
}

export type Logger = typeof logger;
