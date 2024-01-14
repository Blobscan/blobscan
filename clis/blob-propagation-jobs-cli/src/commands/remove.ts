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

const removeCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  queueOptionDef,
  blobHashOptionDef,
  {
    name: "force",
    alias: "f",
    description: "Force removal of jobs by obliterating the selected queues.",
    type: Boolean,
  },
];

export const removeCommandUsage = commandLineUsage([
  {
    header: "Remove Command",
    content: "Removes failed jobs.",
  },
  {
    header: "Options",
    optionList: removeCommandOptDefs,
  },
]);

export const remove: Command = async function (argv) {
  const {
    blobHash: blobHashes,
    force = false,
    help,
    queue: rawQueueNames,
  } = commandLineArgs(removeCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    force?: boolean;
    help?: boolean;
    queue?: string[];
  };

  if (help) {
    console.log(removeCommandUsage);

    return;
  }

  const queueNames = normalizeQueueNames(rawQueueNames);

  if (blobHashes?.length && !force) {
    const selectedQueueJobs = await Promise.all(
      queueManager
        .getQueues(queueNames)
        .map((queue) => getJobsByBlobHashes(queue, blobHashes))
    );

    await Promise.all(
      selectedQueueJobs.map((jobs) => jobs.map((j) => j.remove()))
    );

    return;
  }

  await Promise.all(
    queueManager
      .getQueues(queueNames)
      .map((queue) => (force ? queue.obliterate() : queue.drain()))
  );
};
