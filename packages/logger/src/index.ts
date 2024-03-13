import winston from "winston";

import { env } from "./env";

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

const level = () => {
  return env.NODE_ENV === "production" ? "info" : "debug";
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

winston.addColors(colors);

export const logger = winston.createLogger({
  level: level(),
  format,
  transports: [new winston.transports.Console()],
  silent: env.TEST,
});

export type Logger = typeof logger;

export type LoggerLevel = "error" | "warn" | "info" | "debug";
