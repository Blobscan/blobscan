import { PRIORITY_LIMIT } from "bullmq";
import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import ora from "ora";

import {
  buildIncomingBlobUri,
  computeJobPriority,
  createBlobStorageJob,
  env,
} from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
} from "@blobscan/blob-propagator";
import { Prisma } from "@blobscan/db";
import { prisma } from "@blobscan/db";

import type { HumanQueueName } from "../Context";
import { context } from "../context-instance";
import type { Command } from "../types";
import {
  blobHashOptionDef,
  blockRangeOptionDefs,
  datePeriodOptionDefs,
  helpOptionDef,
  queuesOptionDef,
} from "../utils";

let spinner = ora().start();

const JOB_BATCH_SIZE = 1_000;

const createCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  {
    ...blobHashOptionDef,
    description: "Blob hash of the blobs to create jobs for.",
  },
  {
    ...queuesOptionDef,
    description: `Queue to create the jobs in. ${queuesOptionDef.description}`,
  },
  {
    ...datePeriodOptionDefs.from,
    description: "Date from which to retrieve blobs to create jobs for.",
  },
  {
    ...datePeriodOptionDefs.to,
    description: "Date to which to retrieve blobs to create jobs for.",
  },
  {
    ...blockRangeOptionDefs.from,
    description:
      "Block number from which to retrieve blobs to create jobs for.",
  },
  {
    ...blockRangeOptionDefs.to,
    description: "Block number to which to retrieve blobs for creating jobs.",
  },
];

export const createCommandUsage = commandLineUsage([
  {
    header: "Create Command",
    content: "Create propagation jobs for blobs.",
  },
  {
    header: "Options",
    optionList: createCommandOptDefs,
  },
]);

async function createBlobPropagationJobs(
  storageQueues: BlobPropagationQueue[],
  blobs: { blobHash: string; blockNumber: number }[],
  highestBlockNumber?: number
) {
  if (!blobs.length) {
    return 0;
  }

  let totalJobsCreated = 0;
  let queueIndex = 0;

  for (const queue of storageQueues) {
    const queueName = queue.name;
    spinner = spinner.start(`[${queueName}]: Creating ${blobs.length} jobs…`);
    const jobs = blobs.map(({ blobHash, blockNumber }) =>
      createBlobStorageJob(
        queue.name,
        blobHash,
        buildIncomingBlobUri(env.CHAIN_ID, blobHash),
        {
          priority: computeJobPriority({
            blobBlockNumber: blockNumber,
            highestBlockNumber,
          }),
        }
      )
    );

    const batches = Math.ceil(jobs.length / JOB_BATCH_SIZE);

    let queueJobsCreated = 0;

    for (let i = 0; i < batches; i++) {
      const batchFrom = i * JOB_BATCH_SIZE;
      const batchTo = batchFrom + Math.min(jobs.length, JOB_BATCH_SIZE);
      const batchJobs = jobs.slice(batchFrom, batchTo);

      spinner.start(
        `[${queueName} ${queueIndex + 1}/${storageQueues.length} queues ${
          i + 1
        }/${batches} batches]: Creating ${batchJobs.length}…`
      );

      const createdJobs = await queue.addBulk(
        batchJobs as BlobPropagationJob[]
      );

      queueJobsCreated += createdJobs.length;
    }

    totalJobsCreated += queueJobsCreated;
    queueIndex++;
  }

  spinner.succeed(
    `${totalJobsCreated}) jobs created for queues ${storageQueues
      .map((q) => q.name)
      .join(", ")}`
  );

  return totalJobsCreated;
}

type BlobsQueryResult = {
  blobHash: string;
  blockNumber: number;
  blockTimestamp: Date;
}[];

export const create: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    queue: queueNames,
    fromDate: fromDateArg,
    toDate: toDateArg,
    fromBlock: fromBlockArg,
    toBlock: toBlockArg,
  } = commandLineArgs(createCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    help?: boolean;
    queue?: HumanQueueName[];
    fromDate?: string;
    toDate?: string;
    fromBlock?: number;
    toBlock?: number;
  };

  if (help) {
    console.log(createCommandUsage);

    return;
  }

  const storageQueues = queueNames
    ? context.getQueuesOrThrow(queueNames)
    : context.getAllStorageQueues();

  if (rawBlobHashes?.length) {
    spinner.start(`Checking blob hashes exist…`);
    const uniqueBlobHashes = [
      ...new Set(rawBlobHashes.map((blobHash) => blobHash)),
    ];

    const dbBlobs = await prisma.blobsOnTransactions.findMany({
      distinct: "blobHash",
      select: {
        blockNumber: true,
        blobHash: true,
      },
      where: {
        blobHash: {
          in: uniqueBlobHashes,
        },
      },
    });

    if (dbBlobs.length !== uniqueBlobHashes.length) {
      const notFoundBlobHashes = uniqueBlobHashes.filter(
        (hash) => !dbBlobs.find((b) => b.blobHash === hash)
      );

      throw new Error(
        `Could not find blobs with the following hashes: ${notFoundBlobHashes.join(
          ", "
        )}`
      );
    }

    spinner = spinner.start(`Creating ${dbBlobs.length} jobs in every queue…`);

    const createdJobsCount = await createBlobPropagationJobs(
      storageQueues,
      dbBlobs
    );

    spinner = spinner.succeed(`${createdJobsCount} jobs created!`);

    return;
  }

  spinner = spinner.start(
    "Fetching highest block number for computing job priorities…"
  );

  const highestBlock = await prisma.block.findFirstOrThrow({
    select: {
      number: true,
    },
    take: 1,
    orderBy: {
      number: "desc",
    },
  });

  spinner = spinner.info(
    `Highest block: ${highestBlock.number}. There will be up to ${Math.floor(
      highestBlock.number / PRIORITY_LIMIT
    )} jobs with the same priority`
  );

  let totalJobsCreated = 0;

  let batchDBBlobs: BlobsQueryResult = [];
  const selectedBlobStorages = storageQueues
    ?.map((q) => q.name.split("-")[0] as HumanQueueName)
    .filter((q) => q !== "FINALIZER");

  let filterClause: Prisma.Sql;
  let orderByClause: Prisma.Sql;

  if (!selectedBlobStorages?.length) {
    throw new Error(`No storage queue enabled where to create the jobs in`);
  }

  const blobStorageSqls = selectedBlobStorages
    ? selectedBlobStorages.map(
        (s) => Prisma.sql`r.storage = ${s.toLowerCase()}::blob_storage`
      )
    : [];

  const blobStorageClause = Prisma.sql`
   NOT EXISTS (
      SELECT 1
      FROM blob_data_storage_reference r
      WHERE ${Prisma.join(
        [
          Prisma.sql`r.blob_hash = b.blob_hash`,
          Prisma.join(blobStorageSqls, " AND "),
        ],
        " AND "
      )}
    )
  `;

  if (fromBlockArg || toBlockArg) {
    if (fromBlockArg && toBlockArg) {
      filterClause = Prisma.sql`b.block_number BETWEEN ${fromBlockArg} AND ${toBlockArg}`;
    } else if (fromBlockArg) {
      filterClause = Prisma.sql`b.block_number >= ${fromBlockArg}`;
    } else {
      filterClause = Prisma.sql`b.block_number <= ${toBlockArg}`;
    }

    orderByClause = Prisma.sql`b.block_number DESC`;
  } else if (fromDateArg || toDateArg) {
    const fromDateSql = Prisma.sql`${fromDateArg}::timestamp`;
    const toDateSql = Prisma.sql`${toDateArg}::timestamp`;

    if (fromDateArg && toDateArg) {
      filterClause = Prisma.sql`b.block_timestamp BETWEEN ${fromDateSql} AND ${toDateSql}`;
    } else if (fromDateArg) {
      filterClause = Prisma.sql`b.block_timestamp >= ${fromDateSql}`;
    } else {
      filterClause = Prisma.sql`b.block_timestamp <= ${toDateSql}`;
    }

    orderByClause = Prisma.sql`b.block_timestamp DESC`;
  } else {
    filterClause = Prisma.sql`b.block_number <= ${highestBlock.number}`;
    orderByClause = Prisma.sql`b.block_number DESC`;
  }

  const lastBatchBlob = batchDBBlobs[batchDBBlobs.length - 1];
  const whereClause = Prisma.join([blobStorageClause, filterClause], " AND ");

  spinner = spinner.start(
    `Fetching blobs from db${
      lastBatchBlob
        ? ` starting from ${lastBatchBlob.blockNumber} (${lastBatchBlob.blockTimestamp})`
        : ""
    }…`
  );

  batchDBBlobs = await prisma.$queryRaw<BlobsQueryResult>`
      SELECT b.blob_hash AS "blobHash", b.block_number AS "blockNumber", b.block_timestamp AS "blockTimestamp"
      FROM blobs_on_transactions b
      WHERE
        ${whereClause}
      ORDER BY
        ${orderByClause}
    `;

  spinner = spinner.info(`${batchDBBlobs.length} blobs found`);

  const jobsCreatedCount = await createBlobPropagationJobs(
    storageQueues,
    batchDBBlobs,
    highestBlock.number
  );

  totalJobsCreated += jobsCreatedCount;

  spinner = spinner.succeed(
    `${totalJobsCreated} jobs created to propagate ${batchDBBlobs.length} in every queue!`
  );
};
