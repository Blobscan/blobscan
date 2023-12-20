import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { prisma } from "@blobscan/db";

import { helpOptionDef } from "./common";
import { daily } from "./daily";
import { overall } from "./overall";

const mainDefs: commandLineUsage.OptionDefinition[] = [
  { name: "command", defaultOption: true },
  helpOptionDef,
];

const mainUsage = commandLineUsage([
  {
    header: "Blobscan's Stats Aggregator",
    content:
      "A CLI that facilitates the aggregation of metrics related to different types of entities.",
  },
  {
    header: "Command List",
    content: [
      { name: "{bold daily}", summary: "Aggregates daily stats." },
      { name: "{bold overall}", summary: "Aggregates overall stats." },
    ],
  },
  {
    header: "Options",
    optionList: [helpOptionDef],
  },
]);

async function main() {
  const mainOptions = commandLineArgs(mainDefs, {
    stopAtFirstUnknown: true,
  }) as commandLineArgs.CommandLineOptions & {
    command?: string;
    help?: boolean;
  };
  const { command, help } = mainOptions;

  if (!command && help) {
    console.log(mainUsage);

    return;
  }

  let argv = mainOptions._unknown || [];

  if (help) {
    /**
     * Re-add the help option so that the help message for the
     * subcommand gets printed
     */
    argv.unshift("-h");
  }

  switch (command) {
    case "daily":
      return daily(argv);
    case "overall":
      return overall(argv);
    default:
      throw new Error(`Invalid command: ${command}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Failed to run stats aggregator: ${err}`);
    return process.exit(1);
  })
  .finally(() => prisma.$disconnect());
