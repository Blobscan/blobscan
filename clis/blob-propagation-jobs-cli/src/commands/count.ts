import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import type { QueueHumanName } from "../Context";
import { context } from "../context-instance";
import type { Command } from "../types";
import { helpOptionDef, queuesOptionDef } from "../utils";

const countCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  {
    ...queuesOptionDef,
    description: `Queue to get the jobs count of. ${queuesOptionDef.description}`,
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
  const { help, queue: queueNames } = commandLineArgs(countCommandOptDefs, {
    argv,
  }) as {
    help?: boolean;
    queue?: QueueHumanName[];
  };

  if (help) {
    console.log(countCommandUsage);

    return;
  }

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
