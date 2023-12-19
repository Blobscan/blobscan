import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { retry } from "./commands";
import { helpOptionDef } from "./common";
import { queueManager } from "./queue-manager";

const mainDefs: commandLineUsage.OptionDefinition[] = [
  { name: "command", defaultOption: true },
  helpOptionDef,
];

const mainUsage = commandLineUsage([
  {
    header: "Blobscan's Blob Propagation Job Manager",
    content: "A CLI that facilitates the managing of blob propagation jobs",
  },
  {
    header: "Command List",
    content: [{ name: "{bold retry}", summary: "Retries failed jobs" }],
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
    case "retry":
      return retry(argv);
    default:
      throw new Error(`Invalid command: ${command}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Failed to run CLI: ${err}`);
    return process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(() => queueManager.close());
