import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import type { QueueHumanName } from "../Context";
import { context } from "../context-instance";
import type { Command } from "../types";
import { getJobsByBlobHashes } from "../utils";
import { blobHashOptionDef, helpOptionDef, queuesOptionDef } from "../utils";

const retryCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  blobHashOptionDef,
  {
    ...queuesOptionDef,
    description: `Queue to retry the jobs from. ${queuesOptionDef.description}`,
  },
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
    queue: queueNames,
    blobHash: blobHashes,
  } = commandLineArgs(retryCommandOptDefs, {
    argv,
  }) as {
    help?: boolean;
    queue?: QueueHumanName[];
    blobHash?: string[];
  };

  if (help) {
    console.log(retryCommandUsage);

    return;
  }

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
