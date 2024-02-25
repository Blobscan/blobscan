import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import dayjs from "@blobscan/dayjs";
import type { DatePeriod, RawDatePeriod } from "@blobscan/db";
import { normalizeDailyDatePeriod, prisma } from "@blobscan/db";

import { CommandError } from "../error";
import { Command, Entity } from "../types";
import {
  ALL_ENTITIES,
  commandLog,
  deleteOptionDef,
  helpOptionDef,
} from "../utils";

type Operation = "populate" | "deleteMany" | "deleteAll";

type OperationResult = { entity: Entity; affectedRows: number };
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
    name: "entity",
    alias: "e",
    typeLabel: "{underline type}",
    description:
      "Entity type to aggregate. Valid values are {italic blob}, {italic block} or {italic tx}.",
    type: String,
    multiple: true,
  },
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
  opResults: OperationResult[]
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

  const formattedResults =
    opResults
      ?.map((r) => `${r.entity} (${r.affectedRows} rows affected)`)
      .join(", ") || "";

  return `stats ${formattedOperation} successfully ${period} for entities: ${formattedResults}`;
}

async function performDailyStatsOperation(
  entity: Entity,
  operation: Operation,
  datePeriod?: DatePeriod
) {
  let dailyStatsFn;
  const { from, to } = datePeriod || {};
  const isDateProvided = from || to;
  const operation_: Operation =
    operation === "deleteMany" && !isDateProvided ? "deleteAll" : operation;
  const operationParam =
    operation_ === "populate"
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

  switch (entity) {
    case "blob":
      dailyStatsFn = prisma.blobDailyStats[operation_];
      break;
    case "block":
      dailyStatsFn = prisma.blockDailyStats[operation_];
      break;
    case "tx":
      dailyStatsFn = prisma.transactionDailyStats[operation_];
      break;
  }

  let result;

  try {
    result = await dailyStatsFn(operationParam).then((res) => {
      return typeof res === "number" ? res : res.count;
    });
  } catch (err) {
    const err_ = err as Error;

    throw new DailyCommandError(
      operation,
      `Failed to perform operation for entity ${entity}: ${err_.message}`
    );
  }

  return result;
}

const daily: Command = async function daily(argv) {
  const {
    from: rawFrom,
    to: rawTo,
    entity: entities,
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
    entity?: Entity[];
  };

  if (help) {
    console.log(dailyCommandUsage);

    return;
  }

  const operation: Operation = delete_ ? "deleteMany" : "populate";
  const rawDatePeriod: RawDatePeriod = { from: rawFrom, to: rawTo };
  let datePeriod: DatePeriod;
  try {
    datePeriod = normalizeDailyDatePeriod(rawDatePeriod);
  } catch (err) {
    const err_ = err as Error;

    throw new DailyCommandError(operation, err_);
  }
  const selectedEntities = entities?.length ? entities : ALL_ENTITIES;

  const operationResults: OperationResult[] = await Promise.all(
    selectedEntities.map((e) =>
      performDailyStatsOperation(e, operation, datePeriod).then(
        (affectedRows) => ({
          entity: e,
          affectedRows,
        })
      )
    )
  );

  const msg = buildCommandResultMsg(operation, datePeriod, operationResults);
  commandLog("info", "daily", operation, msg);
};

export { daily };
