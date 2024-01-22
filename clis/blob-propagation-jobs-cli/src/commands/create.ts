import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

import {
  FINALIZER_WORKER_NAME,
  createBlobPropagationFlowJob,
} from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";

import { context } from "../context-instance";
import type { Command } from "../utils";
import {
  blobHashOptionDef,
  datePeriodOptionDefs,
  helpOptionDef,
  normalizeBlobHashes,
  normalizeDate,
  normalizeStorageQueueName,
} from "../utils";

const BATCH_SIZE = 100_000;

const createCommandOptDefs: commandLineArgs.OptionDefinition[] = [
  helpOptionDef,
  {
    ...blobHashOptionDef,
    description: "Blob hash of the blobs to create jobs for.",
  },
  {
    name: "storage",
    alias: "s",
    typeLabel: "{underline storage}",
    description:
      "Storage used to propagate the selected blobs. Valid values are {italic google}, {italic postgres} or {italic swarm}.",
    multiple: true,
    type: String,
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

async function createBlobPropagationJobsInBatches(
  storageQueueNames: string[],
  blobHashesBatchFetcher: (cursorId?: string) => Promise<{
    blobHashes: string[];
    nextCursorId?: string;
  }>
) {
  let cursorId: string | undefined;

  do {
    const { blobHashes, nextCursorId } = await blobHashesBatchFetcher(cursorId);

    const jobs = blobHashes.map((blobHash) =>
      createBlobPropagationFlowJob(
        FINALIZER_WORKER_NAME,
        storageQueueNames,
        blobHash
      )
    );

    if (jobs.length) {
      await context.getPropagatorFlowProducer().addBulk(jobs);
    }

    cursorId = nextCursorId;
  } while (cursorId);
}

export const create: Command = async function (argv) {
  const {
    blobHash: rawBlobHashes,
    help,
    storage: rawStorageNames,
    from: rawFrom,
    to: rawTo,
  } = commandLineArgs(createCommandOptDefs, {
    argv,
  }) as {
    blobHash?: string[];
    help?: boolean;
    storage?: string[];
    from?: string;
    to?: string;
  };

  if (help) {
    console.log(createCommandUsage);

    return;
  }

  const from = rawFrom ? normalizeDate(rawFrom) : undefined;
  const to = rawTo ? normalizeDate(rawTo) : undefined;
  const argStorageNames = rawStorageNames?.map((rawName) =>
    normalizeStorageQueueName(rawName)
  );
  const storageQueues = argStorageNames
    ? context.getQueuesOrThrow(argStorageNames)
    : context.getAllStorageQueues();
  const storageQueueNames = storageQueues.map((q) => q.name);
  let blobHashes: string[];

  if (rawBlobHashes?.length) {
    blobHashes = normalizeBlobHashes(rawBlobHashes);

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

    const jobs = blobHashes.map((blobHash) =>
      createBlobPropagationFlowJob(
        FINALIZER_WORKER_NAME,
        storageQueueNames,
        blobHash
      )
    );

    await context.getPropagatorFlowProducer().addBulk(jobs);
  } else if (from || to) {
    await createBlobPropagationJobsInBatches(
      storageQueueNames,
      async (cursorId) => {
        const dbBlocks = await prisma.block.findMany({
          take: BATCH_SIZE,
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
              gte: from,
              lte: to,
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
      storageQueueNames,
      async (cursorId) => {
        const dbBlobs = await prisma.blob.findMany({
          take: BATCH_SIZE,
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
