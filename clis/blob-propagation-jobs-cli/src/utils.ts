import type { Queue } from "bullmq";
import type commandLineUsage from "command-line-usage";

import { STORAGE_WORKER_NAMES, buildJobId } from "@blobscan/blob-propagator";
import dayjs from "@blobscan/dayjs";
import type { $Enums } from "@blobscan/db";

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

export type Command<R = unknown> = (argv?: string[]) => Promise<R>;

export const helpOptionDef: commandLineUsage.OptionDefinition = {
  name: "help",
  alias: "h",
  description: "Print this usage guide.",
  type: Boolean,
};

export const allQueuesOptionDef: commandLineUsage.OptionDefinition = {
  name: "queue",
  alias: "q",
  typeLabel: "{underline queue}",
  description:
    "Queue to retry failed jobs from. Valid valures are {italic finalizer}, {italic google}, {italic postgres} or {italic swarm}.",
  type: String,
  multiple: true,
};

export const storageQueuesOptionDef: commandLineUsage.OptionDefinition = {
  name: "queue",
  alias: "q",
  typeLabel: "{underline queue}",
  description:
    "Queue to retry failed jobs from. Valid valures are {italic google}, {italic postgres} or {italic swarm}.",
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

export const datePeriodOptionDefs: Record<
  "to" | "from",
  commandLineUsage.OptionDefinition
> = {
  from: {
    name: "fromDate",
    typeLabel: "{underline from-date}",
    description: "Date from which execute jobs.",
    type: String,
  },
  to: {
    name: "toDate",
    typeLabel: "{underline to-date}",
    description: "Date to which execute jobs.",
    type: String,
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

export function normalizeQueueName(input: string) {
  if (input.toUpperCase() === "FINALIZER") {
    return "FINALIZER";
  }

  return normalizeStorageQueueName(input);
}

export function normalizeStorageQueueName(input: string) {
  const input_ = input.toUpperCase();

  const selectedBlobStorage = Object.keys(STORAGE_WORKER_NAMES).find(
    (blobStorageName) => blobStorageName === input_
  );

  if (!selectedBlobStorage) {
    throw new Error(`Invalid queue name: ${input}`);
  }

  return selectedBlobStorage as $Enums.BlobStorage;
}

export function normalizeDate(input: string) {
  return dayjs(input).toISOString();
}

export function normalizeBlobHashes(input: string[]) {
  return [...new Set(input.map((blobHash) => blobHash))];
}

export async function getJobsByBlobHashes(queue: Queue, blobHashes: string[]) {
  return Promise.all(
    blobHashes.map(async (blobHash) => {
      const jobId = buildJobId(queue.name, blobHash);
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Couldn't find job with id ${jobId}`);
      }

      return job;
    })
  );
}
