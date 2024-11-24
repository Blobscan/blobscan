import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { createBlobStorageJob } from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
} from "@blobscan/blob-propagator";
import dayjs from "@blobscan/dayjs";
import type { Prisma } from "@blobscan/db";
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

const blockSelect = {
  number: true,
} satisfies Prisma.BlockSelect;

type BlockPayload = Prisma.BlockGetPayload<{
  select: typeof blockSelect;
}>;

async function findNearestBlock({
  slotOrDate,
  rangeLimit,
}: {
  slotOrDate?: string | number;
  rangeLimit?: "lower" | "upper";
} = {}) {
  const slot = Number(slotOrDate);

  let block: BlockPayload | null;
  const isLower = rangeLimit === "lower";
  const operator = rangeLimit ? (isLower ? "gte" : "lte") : "equals";
  const sort = rangeLimit ? (isLower ? "asc" : "desc") : "asc";

  if (typeof slotOrDate === "undefined") {
    block = await prisma.block.findFirst({
      select: blockSelect,
      orderBy: {
        number: sort,
      },
    });
  } else if (!isNaN(slot)) {
    block = await prisma.block.findFirst({
      select: blockSelect,
      where: {
        slot: {
          [operator]: slot,
        },
      },
      orderBy: {
        slot: sort,
      },
    });
  } else {
    const date = dayjs(slotOrDate).utc();

    if (!date.isValid()) {
      throw new Error(
        `Invalid date "${slotOrDate}". Expected a ISO 8601 date.`
      );
    }

    block = await prisma.block.findFirst({
      select: blockSelect,
      where: {
        timestamp: {
          [operator]: date.format(),
        },
      },
      orderBy: {
        timestamp: sort,
      },
    });
  }

  return block?.number;
}

export const create: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    queue: queueNames,
    fromDate,
    toDate,
    fromBlock: fromBlockArg,
    toBlock: toBlockArg,
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

    return;
  }

  let fromBlock: number;
  let toBlock: number;

  if (fromBlockArg) {
    fromBlock = fromBlockArg;
  } else {
    const nearestBlock = await findNearestBlock({
      slotOrDate: fromDate,
      rangeLimit: "lower",
    });

    if (!nearestBlock) {
      console.log("Skipping as database has no blobs.");

      return;
    }

    fromBlock = nearestBlock;
  }

  if (toBlockArg) {
    toBlock = toBlockArg;
  } else {
    const nearestBlock = await findNearestBlock({
      slotOrDate: toDate,
      rangeLimit: "upper",
    });

    if (!nearestBlock) {
      console.log("Skipping as database has no blobs.");

      return;
    }

    toBlock = nearestBlock;
  }

  console.log(
    `Creating propagation jobs for blobs between blocks ${fromBlock} and ${toBlock}…`
  );

  let batchFromBlock = fromBlock,
    batchToBlock = Math.min(
      fromBlock + PRISMA_BATCH_OPERATIONS_MAX_SIZE,
      toBlock + 1
    );
  let totalJobsCreated = 0;
  let blobVersionedHashes = [];

  do {
    const dbBlobs = await prisma.blobsOnTransactions.findMany({
      select: {
        blockNumber: true,
        blobHash: true,
      },
      where: {
        blockNumber: {
          lt: batchToBlock,
          gte: batchFromBlock,
        },
      },
      orderBy: {
        blockNumber: "asc",
      },
    });

    console.log(
      `Blocks ${batchFromBlock} - ${batchToBlock}: fetched ${dbBlobs.length} blobs`
    );

    blobVersionedHashes = [...new Set(dbBlobs.map((b) => b.blobHash))];

    await createBlobPropagationJobs(storageQueues, blobVersionedHashes);

    console.log(
      `Block ${batchFromBlock} - ${batchToBlock}: ${blobVersionedHashes.length} jobs created`
    );

    batchFromBlock = batchToBlock;
    batchToBlock = Math.min(
      batchToBlock + PRISMA_BATCH_OPERATIONS_MAX_SIZE,
      toBlock + 1
    );

    totalJobsCreated += blobVersionedHashes.length;
  } while (blobVersionedHashes.length && batchToBlock <= toBlock + 1);

  console.log(`Total jobs created: ${totalJobsCreated}`);
};
