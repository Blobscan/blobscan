import type commandLineUsage from "command-line-usage";

import { toDailyDate } from "@blobscan/dayjs";
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

const dateType = (input: string) => {
  const date = toDailyDate(input);

  if (!date.isValid()) {
    throw new Error(`Invalid date "${input}". Expected a ISO 8601 date.`);
  }

  return date.toISOString();
};

export const datePeriodOptionDefs: Record<
  "to" | "from",
  commandLineUsage.OptionDefinition
> = {
  from: {
    name: "from",
    typeLabel: "{underline from-date}",
    description: "Date from which execute jobs.",
    type: dateType,
  },
  to: {
    name: "to",
    typeLabel: "{underline to-date}",
    description: "Date to which execute jobs.",
    type: dateType,
  },
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
