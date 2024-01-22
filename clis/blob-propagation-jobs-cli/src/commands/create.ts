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
    description: "Storage used to propagate the selected blobs. Valid values are {italic google}, {italic postgres} or {italic swarm}.",
    multiple: true,
    type: String
  },
  {
    ...datePeriodOptionDefs.from,
    description: "Date from which to retrieve blobs to create jobs for."
  },
  {
    ...datePeriodOptionDefs.to,
    description: "Date to which to retrieve blobs to create jobs for."
  }
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
  } else if (from || to) {
    const dbBlobs = await prisma.block.findMany({
      select: {
        timestamp: true,
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

    blobHashes = [
      ...new Set(
        dbBlobs
          .map((b) =>
            b.transactions.map((t) => t.blobs.map((bl) => bl.blobHash))
          )
          .flat(2)
      ),
    ];
  } else {
    const dbBlobs = await prisma.blob.findMany();
    blobHashes = dbBlobs.map((b) => b.versionedHash);
  }

  const jobs = blobHashes.map((blobHash) =>
    createBlobPropagationFlowJob(
      FINALIZER_WORKER_NAME,
      storageQueueNames,
      blobHash
    )
  );

  await context.getPropagatorFlowProducer().addBulk(jobs);
};
