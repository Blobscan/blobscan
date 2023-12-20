import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { queueManager } from "../queue-manager";
import type { Command } from "../utils";
import {
  blobHashOptionDef,
  getJobsByBlobHashes,
  helpOptionDef,
  normalizeQueueNames,
  queueOptionDef,
} from "../utils";

const retryCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  queueOptionDef,
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

  const queueNames = normalizeQueueNames(rawQueueNames);

  // If blob hashes are provided, retry only the jobs with those hashes
  if (blobHashes?.length) {
    const selectedQueueJobs = await Promise.all(
      queueManager
        .getQueues(queueNames)
        .map((queue) => getJobsByBlobHashes(queue, blobHashes))
    );

    await Promise.all(
      selectedQueueJobs.map((jobs) => jobs.map((j) => j.retry()))
    );

    return;
  }

  await Promise.all(
    queueNames
      .map((name) => queueManager.getQueue(name))
      .map((queue) => queue.retryJobs())
  );
};
