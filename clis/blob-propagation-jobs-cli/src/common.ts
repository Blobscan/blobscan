import type commandLineUsage from "command-line-usage";

export const helpOptionDef: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const queueOptionDef: commandLineUsage.OptionDefinition = {
  name: "queue",
  alias: "q",
  typeLabel: "{underline queue}",
  description:
    "Queue to retry failed jobs from. Valid valures are {italic finalizer}, {italic google}, {italic postgres} or {italic swarm}.",
  type: String,
  multiple: true,
};

export const blobHashOptionDef: commandLineUsage.OptionDefinition = {
  name: "blobHash",
  alias: "b",
  typeLabel: "{underline blob-hash}",
  description: "Blob hash of the failed jobs to retry.",
  type: String,
  multiple: true,
};

export const connection = {
  host: process.env.REDIS_QUEUE_HOST,
  port: Number(process.env.REDIS_QUEUE_PORT),
  password: process.env.REDIS_QUEUE_PASSWORD,
  username: process.env.REDIS_QUEUE_USERNAME,
};
