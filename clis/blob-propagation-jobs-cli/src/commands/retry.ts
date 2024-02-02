import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { context } from "../context-instance";
import type { Command } from "../utils";
import {
  blobHashOptionDef,
  getJobsByBlobHashes,
  helpOptionDef,
  allQueuesOptionDef,
  normalizeQueueName,
} from "../utils";

const retryCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  allQueuesOptionDef,
  blobHashOptionDef,
];

export const retryCommandUsage = commandLineUsage([
  {
    header: "Retry Command",
    content: "Retries failed jobs.",
  },
  {
    header: "Options",
    optionList: retryCommandOptDefs,
  },
]);

export const retry: Command = async function (argv?: string[]) {
  const {
    help,
    queue: rawQueueNames,
    blobHash: blobHashes,
  } = commandLineArgs(retryCommandOptDefs, {
    argv,
  }) as {
    help?: boolean;
    queue?: string[];
    blobHash?: string[];
  };

  if (help) {
    console.log(retryCommandUsage);

    return;
  }

  const queueNames = rawQueueNames?.map((rawName) =>
    normalizeQueueName(rawName)
  );
  const queues = queueNames
    ? context.getQueues(queueNames)
    : context.getAllQueues();

  // If blob hashes are provided, retry only the jobs with those hashes
  if (blobHashes?.length) {
    const selectedQueueJobs = await Promise.all(
      queues.map((queue) => getJobsByBlobHashes(queue, blobHashes))
    );

    await Promise.all(
      selectedQueueJobs.map((jobs) => jobs.map((j) => j.retry()))
    );

    return;
  }

  await Promise.all(queues.map((queue) => queue.retryJobs()));
};
