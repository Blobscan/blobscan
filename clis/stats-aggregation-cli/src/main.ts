import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { daily, overall } from "./commands";
import { helpOptionDef } from "./utils";

const mainDefs: commandLineUsage.OptionDefinition[] = [
  { name: "command", defaultOption: true },
  helpOptionDef,
];

export const mainUsage = commandLineUsage([
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

export async function main() {
  const mainOptions = commandLineArgs(mainDefs, {
    stopAtFirstUnknown: true,
  }) as commandLineArgs.CommandLineOptions & {
    command?: string;
    help?: boolean;
  };
  const { command, help } = mainOptions;

  if (!command) {
    if (help) {
      console.log(mainUsage);

      return;
    }

    throw new Error("No command specified");
  }

  const argv = mainOptions._unknown || [];

  if (help) {
    /**
     * Re-add the help option so that the help message for the
     * subcommand gets printed
     */
    argv.unshift("-h");
  }

  switch (command) {
    case "daily":
      await daily(argv);

      break;
    case "overall":
      await overall(argv);

      break;
    default:
      throw new Error(`Invalid command: ${command}`);
  }
}
