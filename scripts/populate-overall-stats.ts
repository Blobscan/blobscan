import commandLineUsage from "command-line-usage";

type ScriptArgs = {
  type: string[];
};

const optionDefinitions: commandLineUsage.OptionDefinition[] = [
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

async function main() {}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`An error occurred: ${err}`);
    return process.exit(1);
  })
  .finally(() => prisma.$disconnect());
