import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import type { HumanQueueName } from "../Context";
import { context } from "../context-instance";
import type { Command } from "../types";
import { getJobsByBlobHashes } from "../utils";
import { blobHashOptionDef, helpOptionDef, queuesOptionDef } from "../utils";

const removeCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  blobHashOptionDef,
  {
    ...queuesOptionDef,
    description: `Queue to remove the jobs from. ${queuesOptionDef.description}`,
  },
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
    queue: queueNames,
  } = commandLineArgs(removeCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    force?: boolean;
    help?: boolean;
    queue?: HumanQueueName[];
  };

  if (help) {
    console.log(removeCommandUsage);

    return;
  }

  const queues = queueNames
    ? context.getQueues(queueNames)
    : context.getAllQueues();

  if (blobHashes?.length && !force) {
    const selectedQueueJobs = await Promise.all(
      queues.map((queue) => getJobsByBlobHashes(queue, blobHashes))
    );

    await Promise.all(
      selectedQueueJobs.map((jobs) => jobs.map((j) => j.remove()))
    );

    return;
  }

  await Promise.all(
    queues.map((queue) => (force ? queue.obliterate() : queue.drain()))
  );
};
