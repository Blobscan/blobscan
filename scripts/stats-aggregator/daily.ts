import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import dayjs from "@blobscan/dayjs";
import { normalizeDailyDatePeriod, prisma, RawDatePeriod } from "@blobscan/db";

import { ALL_ENTITIES, deleteOptionDef, Entity, helpOptionDef } from "./common";

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

const dailyCommandUsage = commandLineUsage([
  {
    header: "Daily Command",
    content: "Aggregate daily stats.",
  },
  {
    header: "Options",
    optionList: dailyCommandOptDefs,
  },
]);

export async function performDailyStatsOperation(
  entity: Entity,
  operation: "populate" | "deleteMany",
  rawDatePeriod?: RawDatePeriod
) {
  let dailyStatsFn;
  const datePeriodProvided = rawDatePeriod?.from || rawDatePeriod?.to;
  const { from, to } = normalizeDailyDatePeriod(rawDatePeriod);
  const operation_ =
    operation === "deleteMany" && !datePeriodProvided ? "deleteAll" : operation;
  const operationParam =
    operation_ === "populate"
      ? rawDatePeriod
      : datePeriodProvided
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

  const result = await dailyStatsFn(operationParam).then((res) => {
    if (operation_ === "deleteAll") {
      return "All";
    }

    return typeof res === "number" ? res : res.count;
  });

  const formattedFrom = from
    ? dayjs(from).format("YYYY-MM-DD")
    : "No specified";
  const formattedTo = to ? dayjs(to).format("YYYY-MM-DD") : "No specified";
  const period =
    operation_ !== "deleteAll"
      ? `Period: ${formattedFrom} - ${formattedTo}.`
      : "";

  console.log(
    `Daily ${entity} stats operation \`${operation_}\` executed: ${period} Total stats affected: ${result}`
  );
}

export async function daily(argv?: string[]) {
  const {
    from,
    to,
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

  const datePeriod = { from, to };

  const selectedEntities = entities?.length ? entities : ALL_ENTITIES;

  return Promise.all(
    selectedEntities.map((e) =>
      performDailyStatsOperation(
        e,
        delete_ ? "deleteMany" : "populate",
        datePeriod
      )
    )
  );
}
