import type { Queue } from "bullmq";
import type commandLineUsage from "command-line-usage";

import { STORAGE_WORKER_NAMES, buildJobId } from "@blobscan/blob-propagator";
import dayjs from "@blobscan/dayjs";
import type { $Enums } from "@blobscan/db";

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
    name: "from",
    alias: "f",
    typeLabel: "{underline from}",
    description: "Date from which execute jobs.",
    type: String,
  },
  to: {
    name: "to",
    alias: "t",
    typeLabel: "{underline to}",
    description: "Date to which execute jobs.",
    type: String,
  },
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
