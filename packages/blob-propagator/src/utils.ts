import type { JobsOptions } from "bullmq";

import { logger } from "@blobscan/logger";

import { DEFAULT_JOB_OPTIONS } from "./constants";
import type {
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
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

export function computeJobPriority({
  blobBlockNumber,
  highestBlockNumber,
}: {
  blobBlockNumber?: number;
  highestBlockNumber?: number;
}) {
  if (!blobBlockNumber) {
    return 1;
  }

  return computeLinearPriority(blobBlockNumber, {
    max: highestBlockNumber ?? blobBlockNumber,
  });
}

export function buildJobId(...parts: string[]) {
  return parts.join("-");
}

export function createBlobPropagationJob(
  queueName: string,
  versionedHash: string,
  blobUri: string,
  opts: Partial<JobsOptions> = {}
) {
  const jobId = buildJobId(queueName, versionedHash);

  return {
    name: `propagate_${jobId}`,
    queueName: queueName,
    data: {
      versionedHash,
      blobUri,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId,
    },
  };
}

export async function propagateBlob(
  { versionedHash, blobUri }: BlobPropagationJobData,
  { targetBlobStorage, prisma, primaryBlobStorage }: BlobPropagationWorkerParams
) {
  const targetStorageName = targetBlobStorage.name;
  try {
    let blobData: string;
    try {
      blobData = await primaryBlobStorage.getBlob(blobUri);
    } catch (err) {
      const ref = await prisma.blobDataStorageReference.findUnique({
        where: {
          blobHash_blobStorage: {
            blobHash: versionedHash,
            blobStorage: targetStorageName,
          },
        },
      });

      if (ref) {
        return {
          storage: targetStorageName,
          reference: ref.dataReference,
        };
      }

      throw new Error(`Failed to retrieve blob from primary storage`);
    }

    logger.debug(`Blob ${versionedHash} retrieved from primary storage`);

    const dataReference = await targetBlobStorage.storeBlob(
      versionedHash,
      blobData
    );

    await prisma.blobDataStorageReference.upsert({
      create: {
        blobStorage: targetStorageName,
        blobHash: versionedHash,
        dataReference,
      },
      update: {
        dataReference,
      },
      where: {
        blobHash_blobStorage: {
          blobHash: versionedHash,
          blobStorage: targetStorageName,
        },
      },
    });

    return {
      storage: targetStorageName,
      reference: dataReference,
    };
  } catch (err) {
    throw new Error(`Failed to propagate blob with hash "${versionedHash}"`, {
      cause: err,
    });
  }
}
