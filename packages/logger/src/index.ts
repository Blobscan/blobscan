import winston from "winston";

import { env } from "@blobscan/env";

// Store all loggers to be able to update their level
const loggers: winston.Logger[] = [];

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

function createLogger(opts: winston.LoggerOptions = {}) {
  const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format,
    transports: [new winston.transports.Console()],
    silent: env.TEST,
    ...opts,
  });
  
  // Store the logger to be able to update its level later
  loggers.push(logger);
  
  return logger;
}

export const logger = createLogger();

export function createModuleLogger(...moduleParts: string[]) {
  const module = moduleParts.join(":");

  return createLogger({
    defaultMeta: { module },
  });
}

export type Logger = typeof logger;

export type LoggerLevel = "error" | "warn" | "info" | "http" | "debug";

/**
 * Changes the log level of all loggers.
 * @param level The new log level
 * @returns true if the level was changed, false otherwise
 */
export function setLogLevel(level: LoggerLevel): boolean {
  if (!isValidLogLevel(level)) {
    return false;
  }
  
  // Update all loggers with the new level
  loggers.forEach((logger) => {
    logger.level = level;
  });
  
  return true;
}

/**
 * Gets the current log level.
 * @returns The current log level
 */
export function getLogLevel(): LoggerLevel {
  // Return the level of the main logger
  return logger.level as LoggerLevel;
}

/**
 * Checks if a given string is a valid log level.
 * @param level The level to check
 * @returns true if the level is valid, false otherwise
 */
export function isValidLogLevel(level: string): level is LoggerLevel {
  return ["error", "warn", "info", "http", "debug"].includes(level);
}
