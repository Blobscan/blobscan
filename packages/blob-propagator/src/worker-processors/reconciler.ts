import type { ReconcilerProcessor } from "../types";
import {
  computeJobPriority,
  createBlobPropagationJob,
  MAX_JOB_PRIORITY,
} from "../utils";

export const reconcilerProcessor: ReconcilerProcessor = function ({
  prisma,
  primaryBlobStorage,
  batchSize,
  propagatorQueues,
  highestBlockNumber,
}) {
  return async function () {
    const dbOrphanedBlobs = await prisma.blob.findMany({
      select: {
        firstBlockNumber: true,
        versionedHash: true,
        insertedAt: true,
      },
      where: {
        dataStorageReferences: {
          none: {},
        },
      },
      orderBy: {
        insertedAt: "asc",
      },
      take: batchSize,
    });

    if (!dbOrphanedBlobs.length) {
      return { jobsCreated: 0 };
    }

    const bulkOperations = propagatorQueues.map((q) => {
      const jobs = dbOrphanedBlobs.map(
        ({ versionedHash, firstBlockNumber }) => {
          const priority = firstBlockNumber
            ? computeJobPriority({
                highestBlockNumber: highestBlockNumber ?? firstBlockNumber,
                blobBlockNumber: firstBlockNumber,
              })
            : MAX_JOB_PRIORITY;
          const blobUri = primaryBlobStorage.getBlobUri(versionedHash);

          return createBlobPropagationJob(q.name, versionedHash, blobUri, {
            priority,
          });
        }
      );

      return q.addBulk(jobs);
    });

    const res = await Promise.all(bulkOperations);

    const firstBlob = dbOrphanedBlobs[0];
    const lastBlob = dbOrphanedBlobs[dbOrphanedBlobs.length - 1];

    return {
      jobsCreated: res.flat().length,
      blobTimestamps: {
        firstBlob: firstBlob?.insertedAt,
        lastBlob: lastBlob?.insertedAt,
      },
    };
  };
};
