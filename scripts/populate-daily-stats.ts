import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { DatePeriod, prisma, PrismaPromise } from "@blobscan/db";

import { monitorJob } from "../sentry";

type ScriptArgs = {
  from: string;
  to: string;
  type: string[];
  help: boolean;
};

const optionDefinitions: commandLineUsage.OptionDefinition[] = [
  {
    name: "from",
    alias: "f",
    typeLabel: "{underline date}",
    description: "Start date in {italic DD-MM-YYYY} format.",
    type: String,
  },
  {
    name: "to",
    alias: "o",
    typeLabel: "{underline date}",
    description: "End date in {italic DD-MM-YYYY} format.",
    type: String,
  },
  {
    name: "type",
    alias: "t",
    typeLabel: "{underline type}",
    description: "Type of stats to populate (blob, block or tx).",
    type: String,
    multiple: true,
  },
  {
    name: "help",
    alias: "h",
    description: "Print this usage guide.",
    type: Boolean,
  },
];

const usage = commandLineUsage([
  {
    header: "Blobscan's Daily Stats Populator Script",
    content: "Populates daily stats related to blobs, blocks and transactions.",
  },
  {
    header: "Options",
    optionList: optionDefinitions,
  },
]);
const args = commandLineArgs(optionDefinitions) as Partial<ScriptArgs>;

async function performDailyStatsOp(
  datePeriod: DatePeriod,
  type: "blob" | "block" | "tx"
) {
  let opPromise: PrismaPromise<number>;
  switch (type) {
    case "blob":
      opPromise = prisma.blobDailyStats.populate(datePeriod);
    case "block":
      opPromise = prisma.blockDailyStats.populate(datePeriod);
    case "tx":
      opPromise = prisma.transactionDailyStats.populate(datePeriod);
  }

  console.log(`Total ${type} daily stats upserted: ${await opPromise}`);
}

async function main() {
  return monitorJob("populate-daily-stats", async () => {
    const { from, to, help, type: types } = args;
    const datePeriod = { from, to };

    if (help) {
      console.log(usage);
      return;
    }

    const dailyStatsOperation: Promise<void>[] = [];

    if (!types?.length) {
      dailyStatsOperation.push(performDailyStatsOp(datePeriod, "blob"));
      dailyStatsOperation.push(performDailyStatsOp(datePeriod, "block"));
      dailyStatsOperation.push(performDailyStatsOp(datePeriod, "tx"));
    } else {
      if (types.includes("blob")) {
        dailyStatsOperation.push(performDailyStatsOp(datePeriod, "blob"));
      }

      if (types.includes("block")) {
        dailyStatsOperation.push(performDailyStatsOp(datePeriod, "block"));
      }

      if (types.includes("tx")) {
        dailyStatsOperation.push(performDailyStatsOp(datePeriod, "tx"));
      }
    }

    await Promise.all(dailyStatsOperation);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`An error occurred: ${err}`);
    return process.exit(1);
  })
  .finally(() => prisma.$disconnect());
