import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import { createBlobStorageJob } from "@blobscan/blob-propagator";
import type {
  BlobPropagationJob,
  BlobPropagationQueue,
} from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

import type { QueueHumanName } from "../Context";
import { context } from "../context-instance";
import { env } from "../env";
import type { Command } from "../types";
import {
  blobHashOptionDef,
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
  blobHashesBatchFetcher: (cursorId?: string) => Promise<{
    blobHashes: string[];
    nextCursorId?: string;
  }>
) {
  let cursorId: string | undefined;

  do {
    const { blobHashes, nextCursorId } = await blobHashesBatchFetcher(cursorId);

    await createBlobPropagationJobs(storageQueues, blobHashes);

    cursorId = nextCursorId;
  } while (cursorId);
}

export const create: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    queue: queueNames,
    fromDate,
    toDate,
  } = commandLineArgs(createCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    help?: boolean;
    queue?: QueueHumanName[];
    fromDate?: string;
    toDate?: string;
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
  } else if (fromDate || toDate) {
    await createBlobPropagationJobsInBatches(
      storageQueues,
      async (cursorId) => {
        const dbBlocks = await prisma.block.findMany({
          take: PRISMA_BATCH_OPERATIONS_MAX_SIZE,
          skip: cursorId ? 1 : undefined,
          cursor: cursorId
            ? {
                hash: cursorId,
              }
            : undefined,
          select: {
            hash: true,
            transactions: {
              select: {
                blobs: {
                  select: {
                    blobHash: true,
                  },
                },
              },
            },
          },
          where: {
            timestamp: {
              gte: fromDate,
              lte: toDate,
            },
          },
        });

        const blobHashes = [
          ...new Set(
            dbBlocks
              .map((b) =>
                b.transactions.map((t) => t.blobs.map((bl) => bl.blobHash))
              )
              .flat(2)
          ),
        ];

        return {
          blobHashes,
          nextCursorId: dbBlocks[dbBlocks.length - 1]?.hash,
        };
      }
    );
  } else {
    await createBlobPropagationJobsInBatches(
      storageQueues,
      async (cursorId) => {
        const dbBlobs = await prisma.blob.findMany({
          take: PRISMA_BATCH_OPERATIONS_MAX_SIZE,
          cursor: cursorId
            ? {
                commitment: cursorId,
              }
            : undefined,
          skip: cursorId ? 1 : undefined,
        });
        const blobHashes = dbBlobs.map((b) => b.versionedHash);

        return {
          blobHashes,
          nextCursorId: dbBlobs[dbBlobs.length - 1]?.commitment,
        };
      }
    );
  }
};
