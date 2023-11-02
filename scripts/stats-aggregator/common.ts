import commandLineUsage from "command-line-usage";

export type Entity = "blob" | "block" | "tx";

export const ALL_ENTITIES: Entity[] = ["blob", "block", "tx"];

export const helpOptionDefs: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const commonOptionDefs: commandLineUsage.OptionDefinition[] = [
  {
    name: "delete",
    alias: "d",
    description: "Delete existing stats",
    type: Boolean,
  },
  {
    name: "entity",
    alias: "e",
    typeLabel: "{underline type}",
    description:
      "Entity type to aggregate. Valid values are {italic blob}, {italic block} or {italic tx}.",
    type: String,
    multiple: true,
  },
  helpOptionDefs,
];

const overallCommandOptDefs: commandLineUsage.OptionDefinition[] = [
  ...commonOptionDefs,
];
