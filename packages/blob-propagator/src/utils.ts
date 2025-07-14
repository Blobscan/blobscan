import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import type { BlobStorage } from "@blobscan/db/prisma/enums";

import { DEFAULT_JOB_OPTIONS } from "./constants";
import { logger } from "./logger";
import type {
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
  BlobRetentionMode,
} from "./types";

export const MAX_JOB_PRIORITY = 2_097_152;

export function computeLinearPriority(
  value: number,
  { min = 1, max }: { min?: number; max: number }
): number {
  if (min === max) {
    return 1;
  }

  const clampedBlockNumber = Math.max(min, Math.min(value, max));

  if (clampedBlockNumber === max) {
    return 1;
  }

  const relative = (max - clampedBlockNumber) / (max - min);

  return Math.round(relative * MAX_JOB_PRIORITY);
}

export function buildJobId(...parts: string[]) {
  return parts.join("-");
}

export function createBlobPropagationFlowJob(
  workerName: string,
  storageWorkerNames: string[],
  versionedHash: string,
  temporaryBlobUri: string,
  blobRetentionMode: BlobRetentionMode,
  opts: Partial<JobsOptions> = {}
): FlowJob {
  const { priority, ...restOpts } = opts;
  const propagationFlowJobId = buildJobId(workerName, versionedHash);

  const children = storageWorkerNames.map((name) =>
    createBlobStorageJob(name, versionedHash, blobRetentionMode, {
      priority,
    })
  );

  return {
    name: `propagateBlob:${propagationFlowJobId}`,
    queueName: workerName,
    data: {
      blobRetentionMode,
      temporaryBlobUri,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...restOpts,
      jobId: propagationFlowJobId,
    },
    children,
  };
}

export function createBlobStorageJob(
  storageWorkerName: string,
  versionedHash: string,
  blobRetentionMode?: BlobRetentionMode,
  opts: Partial<JobsOptions> = {}
): FlowChildJob {
  const jobId = buildJobId(storageWorkerName, versionedHash);

  return {
    name: `storeBlob:${jobId}`,
    queueName: storageWorkerName,
    data: {
      versionedHash,
      blobRetentionMode,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId,
      removeDependencyOnFailure: true,
    },
  };
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

    try {
      // TODO: Remove this. It's a temporary fetching logic while we still have both binary and txt files
      try {
        blobData = await temporaryBlobStorage.getBlob(binUri).catch((_) => {
          return temporaryBlobStorage.getBlob(txtUri);
        });

        logger.debug(`Blob ${versionedHash} retrieved from temporary storage`);
      } catch (err) {
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
