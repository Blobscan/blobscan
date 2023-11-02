import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { normalizeDailyDatePeriod, prisma, RawDatePeriod } from "@blobscan/db";

import { ALL_ENTITIES, commonOptionDefs, Entity } from "./common";

const dailyCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  ...commonOptionDefs,
  {
    name: "from",
    alias: "f",
    typeLabel: "{underline date}",
    description: "Start date in {italic DD-MM-YYYY} format.",
    type: String,
  },
  {
    name: "to",
    alias: "t",
    typeLabel: "{underline date}",
    description: "End date in {italic DD-MM-YYYY} format.",
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

async function performDailyStatsOperation(
  entity: Entity,
  operation: "populate" | "deleteMany",
  rawDatePeriod?: RawDatePeriod
) {
  let dailyStatsFn;
  const { from, to } = normalizeDailyDatePeriod(rawDatePeriod);
  const hasDatePeriod = from || to;
  const operation_ =
    operation === "deleteMany" && !hasDatePeriod ? "deleteAll" : operation;
  const operationParam =
    operation_ === "populate"
      ? rawDatePeriod
      : hasDatePeriod
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

  const result = await dailyStatsFn(operationParam).then((res) =>
    typeof res === "number" ? res : res.count
  );

  console.log(
    `Daily ${entity} stats operation \`${operation_}\` executed: ${
      hasDatePeriod ? ` Period: ${from ?? ""} ${to ? `- ${to}` : ""}.` : ""
    } Total stats affected: ${result}`
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
