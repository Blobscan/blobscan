import type commandLineUsage from "command-line-usage";

import { logger } from "@blobscan/logger";

import type { Operation } from "./types";

export const helpOptionDef: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const deleteOptionDef: commandLineUsage.OptionDefinition = {
  name: "delete",
  alias: "d",
  description: "Delete existing stats.",
  type: Boolean,
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function commandLog(
  level: "info" | "error" | "warn" | "debug",
  statsType: "daily" | "overall",
  operation: Operation,
  msg: string
) {
  const formattedStatsType = capitalize(statsType);
  const formattedOperation =
    operation === "deleteMany" ? "deletion" : "aggregation";

  logger[level](
    `${formattedStatsType} stats ${formattedOperation}${
      level === "error" ? " failed" : ""
    }: ${msg}`
  );
}
