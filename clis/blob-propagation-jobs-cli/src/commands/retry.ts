import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { buildJobId, STORAGE_WORKER_NAMES } from "@blobscan/blob-propagator";
import { $Enums } from "@blobscan/db";

import { blobHashOptionDef, helpOptionDef, queueOptionDef } from "../common";
import { queueManager } from "../queue-manager";

const retryCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  queueOptionDef,
  blobHashOptionDef,
];

const retryCommandUsage = commandLineUsage([
  {
    header: "Retry Command",
    content: "Retries failed jobs.",
  },
  {
    header: "Options",
    optionList: retryCommandOptDefs,
  },
]);

function normalizeQueueName(
  input: string
): Parameters<typeof queueManager.getQueue>[0] {
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

export async function retry(argv?: string[]) {
  const {
    help,
    queue: rawQueueNames,
    blobHash: blobHashes,
  } = commandLineArgs(retryCommandOptDefs, {
    argv,
  }) as {
    help: boolean;
    queue?: string[];
    blobHash?: string[];
  };

  if (help) {
    console.log(retryCommandUsage);

    return;
  }

  const queueNames = rawQueueNames
    ? rawQueueNames.map(normalizeQueueName)
    : // If no storage names are provided, retry failed jobs from all storage queues
      Object.values($Enums.BlobStorage);

  // If blob hashes are provided, retry only the jobs with those hashes
  if (blobHashes?.length) {
    const selectedQueueJobs = await Promise.all(
      queueNames.map(async (name) => {
        const queue = queueManager.getQueue(name);

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
      })
    );

    return Promise.all(
      selectedQueueJobs.map((jobs) => jobs.map((j) => j.retry()))
    );
  }

  return Promise.all(
    queueNames
      .map((name) => queueManager.getQueue(name))
      .map((queue) => queue.retryJobs())
  );
}
