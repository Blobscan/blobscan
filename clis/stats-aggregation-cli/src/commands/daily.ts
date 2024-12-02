import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import type { DatePeriodLike } from "@blobscan/dayjs";
import dayjs, { toDailyDatePeriod } from "@blobscan/dayjs";
import type { DatePeriod } from "@blobscan/db";
import { prisma } from "@blobscan/db";

import { CommandError } from "../error";
import type { Command, Operation } from "../types";
import { commandLog, deleteOptionDef, helpOptionDef } from "../utils";

class DailyCommandError extends CommandError {
  constructor(operation: Operation, error: Error | string) {
    const formattedOperation =
      operation === "deleteMany" ? "deletion" : "aggregation";
    const message = error instanceof Error ? error.message : error;

    super(message, {
      command: "daily",
      operation: formattedOperation,
    });
  }
}

const dailyCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  deleteOptionDef,
  helpOptionDef,
  {
    name: "from",
    alias: "f",
    typeLabel: "{underline date}",
    description: "Start date in ISO 8601 format.",
    type: String,
  },
  {
    name: "to",
    alias: "t",
    typeLabel: "{underline date}",
    description: "End date in ISO 8601 format.",
    type: String,
  },
];

export const dailyCommandUsage = commandLineUsage([
  {
    header: "Daily Command",
    content: "Aggregate daily stats.",
  },
  {
    header: "Options",
    optionList: dailyCommandOptDefs,
  },
]);

function buildCommandResultMsg(
  operation: Operation,
  datePeriod: DatePeriod,
  affectedRows: number
) {
  const formattedOperation =
    operation === "deleteMany" ? "deleted" : "calculated";
  const { from, to } = datePeriod || {};
  const formattedFrom = from ? dayjs(from).format("YYYY/MM/DD") : undefined;
  const formattedTo = to ? dayjs(to).format("YYYY/MM/DD") : undefined;
  let period = "";

  if (!from && to) {
    period = `up to ${formattedTo}`;
  } else if (from && !to) {
    period = `from ${formattedFrom}`;
  } else if (from && to) {
    period = `from ${formattedFrom} to ${formattedTo}`;
  }

  return `stats ${formattedOperation} successfully aggregated for period ${period}. Affected rows: ${affectedRows}`;
}

async function performDailyStatsOperation(
  operation: Operation,
  datePeriod?: DatePeriod
): Promise<number> {
  const { from, to } = datePeriod || {};
  const isDateProvided = from || to;
  const operation_: Operation =
    operation === "deleteMany" && !isDateProvided ? "erase" : operation;
  const operationParam =
    operation_ === "aggregate"
      ? datePeriod
      : isDateProvided
      ? {
          where: {
            day: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          },
        }
      : undefined;

  try {
    // The daily stats operation returns the number of affected rows
    const result = await prisma.dailyStats[operation_](operationParam);

    if (typeof result === "number") {
      return result;
    } else if ("count" in result) {
      result.count;
    } else {
      return result.length;
    }
  } catch (err) {
    const err_ = err as Error;

    throw new DailyCommandError(
      operation,
      `Failed to perform operation ${operation}: ${err_.message}`
    );
  }

  return -1;
}

const daily: Command = async function daily(argv) {
  const {
    from: rawFrom,
    to: rawTo,
    // `delete` is a reserved keyword
    delete: delete_,
    help,
  } = commandLineArgs(dailyCommandOptDefs, {
    argv,
  }) as {
    help: boolean;
    delete?: boolean;
    from?: string;
    to?: string;
  };

  if (help) {
    console.log(dailyCommandUsage);

    return;
  }

  const operation: Operation = delete_ ? "deleteMany" : "aggregate";
  const rawDatePeriod: DatePeriodLike = { from: rawFrom, to: rawTo };
  let datePeriod: DatePeriod;
  try {
    datePeriod = toDailyDatePeriod(rawDatePeriod);
  } catch (err) {
    const err_ = err as Error;

    throw new DailyCommandError(operation, err_);
  }

  const affectedRows = await performDailyStatsOperation(operation, datePeriod);

  const msg = buildCommandResultMsg(operation, datePeriod, affectedRows);

  commandLog("info", "daily", operation, msg);
};

export { daily };
