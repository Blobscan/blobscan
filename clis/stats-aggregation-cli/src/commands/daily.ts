import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import dayjs, { toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { CommandError } from "../error";
import type { Command } from "../types";
import {
  commandLog,
  datePeriodOptionDefs,
  deleteOptionDef,
  helpOptionDef,
} from "../utils";

class DailyCommandError extends CommandError {
  constructor(message: string, cause?: Error) {
    super("daily", message, cause);
  }
}

const dailyCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  deleteOptionDef,
  helpOptionDef,
  datePeriodOptionDefs.from,
  datePeriodOptionDefs.to,
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

const DAYS_BATCH = 100;

const daily: Command = async function daily(argv) {
  const {
    from: fromArg,
    to: toArg,
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

  if (fromArg && toArg && dayjs(fromArg).isAfter(dayjs(toArg))) {
    throw new DailyCommandError(
      "Invalid date period. Start date is after end date"
    );
  }

  if (help) {
    console.log(dailyCommandUsage);

    return;
  }

  let from = fromArg,
    to = toArg;

  if (delete_) {
    try {
      if (from || to) {
        const res = await prisma.dailyStats.deleteMany({
          where: {
            day: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          },
        });

        commandLog(
          "info",
          "daily",
          "deleteMany",
          `${res.count} daily stats removed successfully`
        );

        return;
      }

      await prisma.dailyStats.erase();

      commandLog(
        "info",
        "daily",
        "deleteMany",
        "All daily stats removed successfully"
      );

      return;
    } catch (err) {
      throw new DailyCommandError("Failed to delete daily stats", err as Error);
    }
  }

  if (!from) {
    try {
      const firstBlock = await prisma.block.findFirst({
        orderBy: {
          timestamp: "asc",
        },
      });

      if (!firstBlock) {
        commandLog(
          "info",
          "daily",
          "aggregate",
          "No blocks found. Skipping daily stats aggregation."
        );

        return;
      }

      from = toDailyDate(firstBlock.timestamp, "startOf").toISOString();
    } catch (err) {
      throw new DailyCommandError("Failed to fetch first block", err as Error);
    }
  }

  if (!to) {
    to = toDailyDate(new Date(), "endOf").toISOString();
  }

  const totalDays = dayjs(to).diff(dayjs(from), "day") + 1;
  const batches = Math.ceil(totalDays / DAYS_BATCH);

  commandLog(
    "info",
    "daily",
    "aggregate",
    `Aggregating daily stats for ${totalDays} days…`
  );

  try {
    for (let i = 0; i < batches; i++) {
      const startDay = dayjs(from).add(i * DAYS_BATCH, "day");
      const endDay = dayjs(from).add(
        Math.min((i + 1) * DAYS_BATCH, totalDays) - 1,
        "day"
      );

      await prisma.dailyStats.aggregate({
        from: startDay,
        to: endDay,
      });

      commandLog(
        "info",
        "daily",
        "aggregate",
        `Batch ${
          i + 1
        }/${batches}: daily stats aggregated for period ${startDay.format(
          "YYYY/MM/DD"
        )}-${endDay.format("YYYY/MM/DD")}`
      );
    }
  } catch (err) {
    throw new DailyCommandError("Daily stats aggregation failed", err as Error);
  }

  commandLog(
    "info",
    "daily",
    "aggregate",
    "All daily stats aggregated successfully"
  );
};

export { daily };
