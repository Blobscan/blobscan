import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import { DEFAULT_JOB_OPTIONS } from "./constants";
import { logger } from "./logger";
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

export function createBlobPropagationFlowJob(
  workerName: string,
  storageWorkerNames: string[],
  versionedHash: string,
  stagedBlobUri: string,
  opts: Partial<JobsOptions> = {}
): FlowJob {
  const { priority, ...restOpts } = opts;
  const propagationFlowJobId = buildJobId(workerName, versionedHash);

  const children = storageWorkerNames.map((name) =>
    createBlobStorageJob(name, versionedHash, stagedBlobUri, {
      priority,
    })
  );

  return {
    name: `propagateBlob:${propagationFlowJobId}`,
    queueName: workerName,
    data: {
      stagedBlobUri,
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
  stagedBlobUri: string,
  opts: Partial<JobsOptions> = {}
): FlowChildJob {
  const jobId = buildJobId(storageWorkerName, versionedHash);

  return {
    name: `storeBlob:${jobId}`,
    queueName: storageWorkerName,
    data: {
      versionedHash,
      stagedBlobUri,
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
  { versionedHash, stagedBlobUri }: BlobPropagationJobData,
  { targetBlobStorage, prisma, stagingBlobStorage }: BlobPropagationWorkerParams
) {
  const targetStorageName = targetBlobStorage.name;
  try {
    let blobData: string;
    try {
      blobData = await stagingBlobStorage.getBlob(stagedBlobUri);
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

      throw new Error(`Failed to retrieve blob from staging storage`);
    }

    logger.debug(`Blob ${versionedHash} retrieved from staging storage`);

    const blobUri = await targetBlobStorage.storeBlob(versionedHash, blobData);

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
