import type { ReconciliatorProcessor } from "../types";
import { createBlobPropagationFlowJob } from "../utils";

export const reconciliatorProcessor: ReconciliatorProcessor = function ({
  flowProducer,
  prisma,
  primaryBlobStorage,
  batchSize,
  finalizerWorkerName,
  storageWorkerNames,
}) {
  return async function () {
    const dbOrphanedBlobs = await prisma.blob.findMany({
      select: {
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
      return { flowsCreated: 0 };
    }

    const jobs = dbOrphanedBlobs.map((b) =>
      createBlobPropagationFlowJob(
        finalizerWorkerName,
        storageWorkerNames,
        b.versionedHash,
        primaryBlobStorage.getBlobUri(b.versionedHash)
      )
    );

    const createdJobs = await flowProducer.addBulk(jobs);

    const firstBlob = dbOrphanedBlobs[0];
    const lastBlob = dbOrphanedBlobs[dbOrphanedBlobs.length - 1];

    return {
      flowsCreated: createdJobs.length,
      blobTimestamps: {
        firstBlob: firstBlob?.insertedAt,
        lastBlob: lastBlob?.insertedAt,
      },
    };
  };
};
