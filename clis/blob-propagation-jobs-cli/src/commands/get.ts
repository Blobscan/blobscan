import type { Job, JobState } from "bullmq";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { buildJobId } from "@blobscan/blob-propagator";
import type { BlobPropagationJobData } from "@blobscan/blob-propagator";
import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { context } from "../context-instance";
import {
  blobHashOptionDef,
  helpOptionDef,
  allQueuesOptionDef,
  datePeriodOptionDefs,
  normalizeBlobHashes,
  normalizeQueueName,
  blockRangeOptionDefs,
  slotRangeOptionDefs,
  sortOptionDefs,
} from "../utils";
import type { Command } from "../utils";

type JobStatus = (typeof jobStatus)[number];

const jobStatus = [
  "completed",
  "failed",
  "waiting",
  "waiting-children",
  "delayed",
  "prioritized",
] as const;

type PrintableJob = Pick<
  Job<BlobPropagationJobData, any, string>,
  "id" | "timestamp" | "attemptsMade" | "finishedOn" | "failedReason"
> & { index: number; status: JobState | "unknown" };

function printJob(j: PrintableJob) {
  let jobLine = `Job ${j.index !== undefined ? `#${j.index}` : ""} | Id: ${
    j.id
  } | Status: ${j.status} | Timestamp: ${dayjs(j.timestamp)} | Attempts: ${
    j.attemptsMade
  }`;

  if (j.finishedOn) {
    jobLine += ` | Finished Date: ${dayjs(j.finishedOn)}`;
  }

  if (j.failedReason) {
    jobLine += ` | Failed Reason: "${j.failedReason}"`;
  }

  console.log(jobLine);
}

const getCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  {
    ...blobHashOptionDef,
    description: "Hash of the blob to get the job of",
  },
  {
    ...allQueuesOptionDef,
    description:
      "Queue to get the jobs from. Valid values are {italic finalizer}, {italic google}, {italic postgres} or {italic swarm}.",
  },
  {
    ...datePeriodOptionDefs.from,
    description: "Date from which to retrieve blobs to get the jobs of.",
  },
  {
    ...datePeriodOptionDefs.to,
    description: "Date to which to retrieve blobs to get the jobs of.",
  },
  {
    ...slotRangeOptionDefs.from,
    description: "Slot from which to retrieve blobs to get the jobs of.",
  },
  {
    ...slotRangeOptionDefs.to,
    description: "Slot to which to retrieve blobs to get the jobs of.",
  },
  {
    ...blockRangeOptionDefs.from,
    description: "Block from which to retrieve blobs to get the jobs of.",
  },
  {
    ...blockRangeOptionDefs.to,
    description: "Block to which to retrieve blobs to get the jobs of.",
  },
  {
    name: "status",
    alias: "t",
    description:
      "Status of the jobs to get. Valid values are {italic completed}, {italic failed}, {italic waiting}, {italic waiting-children}, {italic delayed} or {italic prioritized}.",
    type: (value: string): JobStatus => {
      if (!jobStatus.includes(value as JobStatus)) {
        throw new Error(
          `Invalid status value. Valid values are ${jobStatus.join(", ")}.`
        );
      }

      return value as JobStatus;
    },
    defaultValue: "failed",
  },
  {
    name: "fromIndex",
    alias: "i",
    description: "Index of the first job to get.",
    type: Number,
    defaultValue: 0,
  },
  {
    name: "toIndex",
    alias: "f",
    description: "Index of the last job to get.",
    type: Number,
    defaultValue: 500,
  },
  sortOptionDefs,
];

export const getCommandUsage = commandLineUsage([
  {
    header: "Get Command",
    content: "Get propagation jobs.",
  },
  {
    header: "Options",
    optionList: getCommandOptDefs,
  },
]);

export const get: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    queue: rawQueueNames,
    fromBlock,
    toBlock,
    fromDate: rawFromDate,
    toDate: rawToDate,
    fromSlot,
    toSlot,
    fromIndex,
    toIndex,
    status,
    sort,
  } = commandLineArgs(getCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    help?: boolean;
    queue?: string[];
    fromBlock: number;
    toBlock: number;
    fromDate?: string;
    toDate?: string;
    fromSlot?: number;
    toSlot?: number;
    fromIndex: number;
    toIndex: number;
    status: JobState;
    sort: "asc" | "desc";
  };

  if (help) {
    console.log(getCommandUsage);

    return;
  }

  const queueNames = rawQueueNames?.map((rawName) =>
    normalizeQueueName(rawName)
  );
  const queues = queueNames
    ? context.getQueues(queueNames)
    : context.getAllQueues();
  let blobHashes: string[] = rawBlobHashes
    ? normalizeBlobHashes(rawBlobHashes)
    : [];
  const fromDate = rawFromDate ? new Date(rawFromDate) : undefined;
  const toDate = rawToDate ? new Date(rawToDate) : undefined;

  const filtersProvided =
    fromBlock || toBlock || fromDate || toDate || fromSlot || toSlot;

  if (fromBlock && toBlock && toBlock < fromBlock) {
    throw new Error("toBlock must be greater than fromBlock.");
  }

  if (fromSlot && toSlot && toSlot < fromSlot) {
    throw new Error("toSlot must be greater than fromSlot.");
  }

  if (blobHashes.length) {
    blobHashes = normalizeBlobHashes(blobHashes);
  } else if (filtersProvided) {
    const dbBlobs = await prisma.blobsOnTransactions.findMany({
      take: toIndex - fromIndex,
      skip: fromIndex,
      select: {
        blobHash: true,
        transaction: {
          select: {
            block: {
              select: {
                timestamp: true,
              },
            },
          },
        },
      },
      orderBy: {
        transaction: {
          block: {
            number: sort,
          },
        },
      },
      where: {
        transaction: {
          block: {
            number:
              fromBlock || toBlock
                ? { gte: fromBlock, lte: toBlock }
                : undefined,
            slot:
              fromSlot || toSlot ? { gte: fromSlot, lte: toSlot } : undefined,
            timestamp:
              fromDate || toDate ? { gte: fromDate, lte: toDate } : undefined,
          },
        },
      },
    });

    if (!dbBlobs.length) {
      console.log("No blobs found with the provided filters.");

      return;
    }

    blobHashes = [...new Set(dbBlobs.map((dbBlob) => dbBlob.blobHash))];
  }

  if (blobHashes.length) {
    const jobPromises = queues.flatMap((q) => {
      let index = fromIndex;

      return blobHashes.map<Promise<PrintableJob | undefined>>(async (hash) => {
        const jobId = buildJobId(q.name, hash);

        const [j, status] = await Promise.all([
          q.getJob(jobId),
          q.getJobState(jobId),
        ]);

        return j ? { ...j, status, index: index++ } : undefined;
      });
    });

    const jobs = await Promise.all(jobPromises);
    const existingJobs = jobs.filter((j): j is PrintableJob => !!j);

    if (!existingJobs?.length) {
      console.log("No blob propagation jobs found.");

      return;
    }

    existingJobs.forEach(printJob);

    return;
  }

  const jobs = (
    await Promise.all(
      queues.map((q) =>
        q.getJobs(status, fromIndex, toIndex, sort === "asc").then((jobs) => {
          let index = fromIndex;

          return jobs.map<PrintableJob>((j) => ({
            ...j,
            index: index++,
            status,
          }));
        })
      )
    )
  ).flat();

  jobs.forEach(printJob);
};
