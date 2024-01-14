import type { Queue } from "bullmq";
import type commandLineUsage from "command-line-usage";

import { STORAGE_WORKER_NAMES, buildJobId } from "@blobscan/blob-propagator";
import { $Enums } from "@blobscan/db";

import { env } from "./env";

export type Command = (argv?: string[]) => Promise<void>;

export const connection = {
  host: env.REDIS_QUEUE_HOST,
  port: Number(env.REDIS_QUEUE_PORT),
  password: env.REDIS_QUEUE_PASSWORD,
  username: env.REDIS_QUEUE_USERNAME,
};

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

export function normalizeQueueName(input: string) {
  const input_ = input.toUpperCase();

  if (input_ === "FINALIZER") {
    return "FINALIZER";
  }
  const selectedBlobStorage = Object.keys(STORAGE_WORKER_NAMES).find(
    (blobStorageName) => blobStorageName === input_
  );

  if (!selectedBlobStorage) {
    throw new Error(`Invalid queue name: ${input}`);
  }

  return selectedBlobStorage as $Enums.BlobStorage;
}

export function normalizeQueueNames(input?: string[]) {
  return input
    ? input.map(normalizeQueueName)
    : // If no storage names are provided, retry failed jobs from all storage queues
      Object.values($Enums.BlobStorage);
}

export async function getJobsByBlobHashes(queue: Queue, blobHashes: string[]) {
  return Promise.all(
    blobHashes.map(async (blobHash) => {
      const jobId = buildJobId(queue, blobHash);
      const job = await queue.getJob(jobId);

      if (!job) {
        throw new Error(`Couldn't find job with id ${jobId}`);
      }

      return job;
    })
  );
}
