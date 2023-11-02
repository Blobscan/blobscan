import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { prisma } from "@blobscan/db";

import { ALL_ENTITIES, commonOptionDefs, Entity } from "./common";

const overallCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  ...commonOptionDefs,
];

const overallCommandUsage = commandLineUsage([
  {
    header: "Overall Command",
    content: "Aggregate overall stats.",
  },
  {
    header: "Options",
    optionList: overallCommandOptDefs,
  },
]);

async function performOverallStatsOperation(
  entity: Entity,
  operation: "populate" | "deleteMany"
) {
  let overallStatsFn;

  switch (entity) {
    case "blob":
      overallStatsFn = prisma.blobOverallStats[operation];
      break;
    case "block":
      overallStatsFn = prisma.blockOverallStats[operation];
      break;
    case "tx":
      overallStatsFn = prisma.transactionOverallStats[operation];
      break;
  }

  const result = await overallStatsFn().then((res) =>
    typeof res === "number" ? res : res.count
  );

  console.log(
    `Overall ${entity} stats operation \`${operation}\` executed: Total stats affected: ${result}`
  );
}

export async function overall(argv?: string[]) {
  const {
    entity: entities,
    delete: delete_,
    help,
  } = commandLineArgs(overallCommandOptDefs, {
    argv,
  }) as {
    delete?: boolean;
    entity?: Entity[];
    help: boolean;
  };

  if (help) {
    console.log(overallCommandUsage);

    return;
  }

  const selectedEntities = entities?.length ? entities : ALL_ENTITIES;

  return Promise.all(
    selectedEntities.map((e) =>
      performOverallStatsOperation(e, delete_ ? "deleteMany" : "populate")
    )
  );
}
