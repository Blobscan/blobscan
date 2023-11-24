import commandLineUsage from "command-line-usage";

export type Entity = "blob" | "block" | "tx";

export const ALL_ENTITIES: Entity[] = ["blob", "block", "tx"];

export const helpOptionDef: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const deleteOptionDef: commandLineUsage.OptionDefinition = {
  name: "delete",
  alias: "d",
  description: "Delete existing stats.",
  type: Boolean,
};
