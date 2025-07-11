import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import type { BlobStorage } from "@blobscan/db/prisma/enums";

import { DEFAULT_JOB_OPTIONS } from "./constants";
import { logger } from "./logger";
import type {
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
  BlobRententionMode,
} from "./types";

export function buildJobId(...parts: string[]) {
  return parts.join("-");
}

export function createBlobPropagationFlowJob(
  workerName: string,
  storageWorkerNames: string[],
  versionedHash: string,
  temporaryBlobUri: string,
  blobRententionMode: BlobRententionMode,
  opts: Partial<JobsOptions> = {}
): FlowJob {
  const propagationFlowJobId = buildJobId(workerName, versionedHash);

  const children = storageWorkerNames.map((name) =>
    createBlobStorageJob(name, versionedHash, blobRententionMode)
  );

  return {
    name: `propagateBlob:${propagationFlowJobId}`,
    queueName: workerName,
    data: {
      blobRententionMode,
      temporaryBlobUri,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId: propagationFlowJobId,
    },
    children,
  };
}

export function createBlobStorageJob(
  storageWorkerName: string,
  versionedHash: string,
  blobRententionMode?: BlobRententionMode,
  opts: Partial<JobsOptions> = {}
): FlowChildJob {
  const jobId = buildJobId(storageWorkerName, versionedHash);

  return {
    name: `storeBlob:${jobId}`,
    queueName: storageWorkerName,
    data: {
      versionedHash,
      blobRententionMode,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId,
      removeDependencyOnFailure: true,
    },
  };
}

function formatErrorWithCauses(error: unknown): string {
  if (!(error instanceof Error)) return String(error);

  let message = `Error: ${error.message}`;
  let current: unknown = error;
  let depth = 0;

  while (current instanceof Error && current.cause) {
    depth++;
    current = current.cause;
    if (current instanceof Error) {
      message += `\nCaused by (${depth}): ${current.message}`;
    } else {
      message += `\nCaused by (${depth}): ${String(current)}`;
    }
  }

  return message;
}

export async function propagateBlob(
  { blobRetentionMode, versionedHash }: BlobPropagationJobData,
  targetStorageName: BlobStorage,
  {
    blobStorageManager,
    prisma,
    temporaryBlobStorage,
  }: BlobPropagationWorkerParams
) {
  try {
    let blobData: string;
    const uri = temporaryBlobStorage.getBlobUri(versionedHash);
    const rawUri = uri?.slice(0, -4);
    const binUri = `${rawUri}.bin`;
    const txtUri = `${rawUri}.txt`;

    logger.debug(
      `Mode: ${blobRetentionMode}. Temporary Blob Storage: ${temporaryBlobStorage.name}`
    );

    try {
      // TODO: Remove this. It's a temporary fetching logic while we still have both binary and txt files
      try {
        blobData = await temporaryBlobStorage.getBlob(binUri).catch((err) => {
          logger.debug(binUri);
          logger.debug(formatErrorWithCauses(err));

          return temporaryBlobStorage.getBlob(txtUri);
        });

        logger.debug(`Blob ${versionedHash} retrieved from temporary storage`);
      } catch (err) {
        logger.debug(txtUri);
        logger.debug(formatErrorWithCauses(err));
        blobData = await blobStorageManager
          .getBlobByHash(versionedHash)
          .then(({ data }) => data);
      }
    } catch (err) {
      const blobRefs = await prisma.blobDataStorageReference
        .findMany({
          where: {
            blobHash: versionedHash,
          },
        })
        .then((refs): BlobReference[] =>
          refs.map((ref) => ({
            reference: ref.dataReference,
            storage: ref.blobStorage,
          }))
        );

      if (!blobRefs.length) {
        throw new Error(
          `No blob storage references found to retrieve data from`
        );
      }

      const result = await blobStorageManager.getBlobByReferences(...blobRefs);

      blobData = result.data;
    }

    const targetStorage = blobStorageManager.getStorage(targetStorageName);

    if (!targetStorage) {
      throw new Error(`Target storage "${targetStorageName}" not found`);
    }

    const blobUri = await targetStorage.storeBlob(versionedHash, blobData);

    await prisma.blobDataStorageReference.upsert({
      create: {
        blobStorage: targetStorageName,
        blobHash: versionedHash,
        dataReference: blobUri,
      },
      update: {
        dataReference: blobUri,
      },
      where: {
        blobHash_blobStorage: {
          blobHash: versionedHash,
          blobStorage: targetStorageName,
        },
      },
    });

    if (blobRetentionMode === "eager") {
      await Promise.allSettled([
        temporaryBlobStorage.removeBlob(binUri),
        temporaryBlobStorage.removeBlob(txtUri),
      ]);

      logger.debug(`Blob ${versionedHash} removed from temporary storage`);
    }

    return {
      storage: targetStorageName,
      reference: blobUri,
    };
  } catch (err) {
    throw new Error(`Failed to propagate blob with hash "${versionedHash}"`, {
      cause: err,
    });
  }
}
