import type commandLineUsage from "command-line-usage";

import { STORAGE_WORKER_NAMES } from "@blobscan/blob-propagator";
import dayjs from "@blobscan/dayjs";

const QUEUE_NAMES = Object.keys(STORAGE_WORKER_NAMES);

function isPositiveInteger(value: string | number) {
  const number = Number(value);

  return !isNaN(number) && Number.isInteger(number) && number >= 0;
}

const blockType = (input: string): number => {
  const value = Number(input);

  if (!isPositiveInteger(value)) {
    throw new Error(
      `Invalid value "${input}". Block must be a positive integer.`
    );
  }

  return value;
};

const slotType = (input: string): number => {
  const value = Number(input);

  if (!isPositiveInteger(value)) {
    throw new Error(
      `Invalid value "${input}". Slot must be a positive integer.`
    );
  }

  return value;
};

const dateType = (input: string): string => {
  const date = dayjs.utc(input);
  if (!date.isValid()) {
    throw new Error(`Invalid date "${input}". Expected a ISO 8601 date.`);
  }

  return date.format();
};

const queueType = (input: string): string => {
  const input_ = input.toUpperCase();

  if (!QUEUE_NAMES.includes(input_)) {
    throw new Error(
      `Invalid queue '${input}'. Valid values are ${QUEUE_NAMES.map((q) =>
        q.toLowerCase()
      ).join(", ")}.`
    );
  }

  return input_;
};

export const helpOptionDef: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const queuesOptionDef: commandLineUsage.OptionDefinition = {
  name: "queue",
  alias: "q",
  typeLabel: "{underline queue}",
  description: `Valid values are ${QUEUE_NAMES.map(
    (q) => `{italic ${q.toLowerCase()}}`
  ).join(", ")}`,
  type: queueType,
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

export const datePeriodOptionDefs: Record<
  "to" | "from",
  commandLineUsage.OptionDefinition
> = {
  from: {
    name: "fromDate",
    typeLabel: "{underline from-date}",
    description: "Date from which execute jobs.",
    type: dateType,
  },
  to: {
    name: "toDate",
    typeLabel: "{underline to-date}",
    description: "Date to which execute jobs.",
    type: dateType,
  },
};

export const slotRangeOptionDefs = {
  from: {
    name: "fromSlot",
    typeLabel: "{underline from-slot}",
    type: slotType,
  },
  to: {
    name: "toSlot",
    typeLabel: "{underline to-slot}",
    type: slotType,
  },
};

export const blockRangeOptionDefs = {
  from: {
    name: "fromBlock",
    typeLabel: "{underline from-block}",
    type: blockType,
  },
  to: {
    name: "toBlock",
    typeLabel: "{underline to-block}",
    type: blockType,
  },
};

export const sortOptionDefs = {
  name: "sort",
  alias: "s",
  description:
    "Sort the jobs in ascending or descending order. Valid values are {italic asc} or {italic desc}. Default is {italic desc}.",
  type: (value: string): "asc" | "desc" => {
    if (value !== "asc" && value !== "desc") {
      throw new Error("Sort must be 'asc' or 'desc'.");
    }

    return value as "asc" | "desc";
  },
  defaultValue: "desc",
};
