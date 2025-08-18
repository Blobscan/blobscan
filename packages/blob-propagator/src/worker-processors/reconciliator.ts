import type { ReconciliatorProcessor } from "../types";
import { createBlobPropagationFlowJob } from "../utils";

export const reconciliatorProcessor: ReconciliatorProcessor = function ({
  flowProducer,
  prisma,
  stagingBlobStorage,
  batchSize,
  finalizerWorkerName,
  storageWorkerNames,
}) {
  return async function () {
    const dbOrphanedBlobs = await prisma.blob.findMany({
      select: {
        versionedHash: true,
      },
      where: {
        dataStorageReferences: {
          none: {},
        },
      },
      orderBy: {
        insertedAt: "desc",
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
        stagingBlobStorage.getStagedBlobUri(b.versionedHash)
      )
    );

    const createdJobs = await flowProducer.addBulk(jobs);

    return {
      flowsCreated: createdJobs.length,
    };
  };
};
