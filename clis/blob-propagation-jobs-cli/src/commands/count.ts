import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { context } from "../context-instance";
import {
  helpOptionDef,
  allQueuesOptionDef,
  normalizeQueueName,
} from "../utils";
import type { Command } from "../utils";

const countCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  {
    ...allQueuesOptionDef,
    description:
      "Queue to get the jobs count of. Valid values are {italic finalizer}, {italic google}, {italic postgres} or {italic swarm}.",
  },
];

export const countCommandUsage = commandLineUsage([
  {
    header: "Count Command",
    content: "Count propagation jobs.",
  },
  {
    header: "Options",
    optionList: countCommandOptDefs,
  },
]);

export const count: Command = async function (argv) {
  const { help, queue: rawQueueNames } = commandLineArgs(countCommandOptDefs, {
    argv,
  }) as {
    help?: boolean;
    queue?: string[];
  };

  if (help) {
    console.log(countCommandUsage);

    return;
  }

  const queueNames = rawQueueNames?.map((rawName) =>
    normalizeQueueName(rawName)
  );
  const queues = queueNames
    ? context.getQueues(queueNames)
    : context.getAllQueues();

  const jobCounts = await Promise.all(
    queues.map(async (q) => ({
      queueName: q.name,
      count: await q.getJobCounts(),
    }))
  );

  console.log(jobCounts);
};
