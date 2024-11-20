import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { createBlobStorageJob } from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
} from "@blobscan/blob-propagator";
import type { BlockNumberRange } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import type { QueueHumanName } from "../Context";
import { context } from "../context-instance";
import type { Command } from "../types";
import {
  blobHashOptionDef,
  blockRangeOptionDefs,
  datePeriodOptionDefs,
  helpOptionDef,
  queuesOptionDef,
} from "../utils";

// TODO: Need to convert it to number explicity due to ci tests failing
// with the following error:
const PRISMA_BATCH_OPERATIONS_MAX_SIZE = parseInt(
  env.PRISMA_BATCH_OPERATIONS_MAX_SIZE.toString()
);

function getChainFirstBlockNumber(network: typeof env.NETWORK_NAME): number {
  switch (network) {
    case "sepolia":
      return 5187052;
    case "holesky":
      return 894735;
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

const INITIAL_BLOCK_NUMBER = getChainFirstBlockNumber(env.NETWORK_NAME);

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
    description: "Block number to which to retrieve blobs to create jobs for.",
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

function createBlobPropagationJobs(
  storageQueues: BlobPropagationQueue[],
  blobHashes: string[]
) {
  return Promise.all(
    storageQueues.map((q) => {
      const storageJobs = blobHashes.map((hash) =>
        createBlobStorageJob(q.name, hash)
      );

      q.addBulk(storageJobs as BlobPropagationJob[]);
    })
  );
}

async function createBlobPropagationJobsInBatches(
  storageQueues: BlobPropagationQueue[],
  blobHashesBatchFetcher: (blockRange: BlockNumberRange) => Promise<string[]>,
  blockRange?: Partial<BlockNumberRange>
) {
  let blockRange_: BlockNumberRange = {
    from: blockRange?.from ?? INITIAL_BLOCK_NUMBER,
    to:
      (blockRange?.to ?? INITIAL_BLOCK_NUMBER) +
      PRISMA_BATCH_OPERATIONS_MAX_SIZE,
  };

  let blobHashes = [];

  do {
    blobHashes = await blobHashesBatchFetcher(blockRange_);

    await createBlobPropagationJobs(storageQueues, blobHashes);

    blockRange_ = {
      from: blockRange_.to,
      to: blockRange_.to + PRISMA_BATCH_OPERATIONS_MAX_SIZE,
    };
  } while (blobHashes.length);
}

export const create: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    queue: queueNames,
    fromDate,
    toDate,
    fromBlock,
    toBlock,
  } = commandLineArgs(createCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    help?: boolean;
    queue?: QueueHumanName[];
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
  let blobHashes: string[];

  if (rawBlobHashes?.length) {
    blobHashes = [...new Set(rawBlobHashes.map((blobHash) => blobHash))];

    const dbBlobs = await prisma.blob.findMany({
      where: {
        versionedHash: {
          in: blobHashes,
        },
      },
    });

    if (dbBlobs.length !== blobHashes.length) {
      const notFoundBlobHashes = blobHashes.filter(
        (hash) => !dbBlobs.find((b) => b.versionedHash === hash)
      );

      throw new Error(
        `Could not find blobs with the following hashes: ${notFoundBlobHashes.join(
          ", "
        )}`
      );
    }

    await createBlobPropagationJobs(storageQueues, blobHashes);
  } else if (fromBlock || toBlock) {
    await createBlobPropagationJobsInBatches(
      storageQueues,
      async (blockRange) => {
        const dbBlobs = await prisma.blobsOnTransactions.findMany({
          select: {
            blockNumber: true,
            blobHash: true,
          },
          where: {
            blockNumber: {
              lt: blockRange.to,
              gte: blockRange.from,
            },
          },
          orderBy: {
            blockNumber: "asc",
          },
        });

        const blobHashes = [...new Set(dbBlobs.map((b) => b.blobHash))];

        return blobHashes;
      },
      {
        from: fromBlock,
        to: toBlock,
      }
    );
  } else if (fromDate || toDate) {
    await createBlobPropagationJobsInBatches(
      storageQueues,
      async (blockRange) => {
        const dbBlobs = await prisma.blobsOnTransactions.findMany({
          select: {
            blockNumber: true,
            blobHash: true,
          },
          where: {
            blockNumber: {
              lt: blockRange.to,
              gte: blockRange.from,
            },
          },
          orderBy: {
            blockNumber: "asc",
          },
        });

        const blobHashes = [...new Set(dbBlobs.map((b) => b.blobHash))];

        return blobHashes;
      }
    );
  } else {
    await createBlobPropagationJobsInBatches(
      storageQueues,
      async (blockRange) => {
        const dbBlobs = await prisma.blobsOnTransactions.findMany({
          select: {
            blockNumber: true,
            blobHash: true,
          },
          where: {
            blockNumber: {
              lt: blockRange.to,
              gte: blockRange.from,
            },
          },
          orderBy: {
            blockNumber: "asc",
          },
        });

        const blobHashes = [...new Set(dbBlobs.map((b) => b.blobHash))];

        return blobHashes;
      }
    );
  }
};
