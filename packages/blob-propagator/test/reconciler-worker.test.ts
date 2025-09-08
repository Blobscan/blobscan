import type { Job } from "bullmq";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobStorage } from "@blobscan/blob-storage-manager";
import type { Blob } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import type {
  BlobPropagationJob,
  PropagationQueue,
  ReconcilerProcessorResult,
} from "../src";
import { buildJobId, STORAGE_WORKER_NAMES } from "../src";
import { reconcilerProcessor } from "../src/worker-processors/reconciler";
import { createStorageFromEnv } from "./helpers";

describe("Reconciler Worker", () => {
  let propagatorQueues: PropagationQueue[];
  let primaryBlobStorage: BlobStorage;
  const batchSize = 2;

  const orphanedBlobs: Blob[] = [
    {
      versionedHash:
        "0x0110000000000000000000000000000000000000000000000000000000000b10",
      commitment:
        "0x100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      firstBlockNumber: null,
      proof:
        "0x110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      size: 131072,
      usageSize: 131050,
      insertedAt: new Date("2024-01-01T00:00:00"),
      updatedAt: new Date("2024-01-01T00:00:00"),
    },
    {
      versionedHash:
        "0x0120000000000000000000000000000000000000000000000000000000000000",
      commitment:
        "0x20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      firstBlockNumber: null,
      proof:
        "0x220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      size: 131072,
      usageSize: 131050,
      insertedAt: new Date("2024-01-08T00:00:00"),
      updatedAt: new Date("2024-01-08T00:00:00"),
    },
    {
      versionedHash:
        "0x0130000000000000000000000000000000000000000000000000000000000000",
      commitment:
        "0x30000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      firstBlockNumber: null,
      proof:
        "0x330000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      size: 131072,
      usageSize: 131050,
      insertedAt: new Date("2024-01-15T00:00:00"),
      updatedAt: new Date("2024-01-20T00:00:00"),
    },
  ];

  beforeAll(async () => {
    const connection = new IORedis(env.REDIS_URI, {
      maxRetriesPerRequest: null,
    });

    propagatorQueues = Object.values(STORAGE_WORKER_NAMES).map(
      (name) => new Queue(name, { connection })
    );

    primaryBlobStorage = await createStorageFromEnv(env.PRIMARY_BLOB_STORAGE);

    return async () => {
      let teardownPromise = Promise.resolve();

      propagatorQueues.forEach((q) => {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        teardownPromise = teardownPromise.finally(async () => {
          await q.close();
        });
      });

      await teardownPromise;
    };
  });

  describe("when having orphaned blobs", () => {
    let jobs: BlobPropagationJob[];
    let processorResult: ReconcilerProcessorResult;

    beforeEach(async () => {
      await prisma.blob.createMany({
        data: orphanedBlobs,
      });

      const processor = reconcilerProcessor({
        batchSize,
        prisma,
        primaryBlobStorage,
        propagatorQueues,
      });

      processorResult = await processor({} as Job);

      jobs = await Promise.all(
        orphanedBlobs.flatMap((b) =>
          propagatorQueues.map((q) =>
            q.getJob(buildJobId(q.name, b.versionedHash))
          )
        )
      ).then((res) => res.filter((el) => !!el));

      return async () => {
        await prisma.blob.deleteMany({
          where: {
            OR: orphanedBlobs.map((b) => ({ versionedHash: b.versionedHash })),
          },
        });

        try {
          await Promise.all(
            jobs.map((j) => j.remove({ removeChildren: true }))
          );
        } catch (err) {
          /* empty */
        }
      };
    });

    it("should create propagation jobs starting from the oldest blob", () => {
      const expectedJobIds = orphanedBlobs
        .slice(0, batchSize)
        .flatMap((b) =>
          propagatorQueues.map((q) => buildJobId(q.name, b.versionedHash))
        );

      const jobIds = jobs.map((j) => j.id);

      expect(jobIds).toEqual(expectedJobIds);
    });

    it("should create propagation jobs with the correct job data", async () => {
      const expectedJobsData = orphanedBlobs.slice(0, batchSize).flatMap((b) =>
        propagatorQueues.map((q) => ({
          jobId: buildJobId(q.name, b.versionedHash),
          data: {
            blobUri: primaryBlobStorage.getBlobUri(b.versionedHash),
            versionedHash: b.versionedHash,
          },
        }))
      );
      const jobsData = jobs.map((j) => ({
        jobId: j.id,
        data: j.data,
      }));

      expect(jobsData).toEqual(expectedJobsData);
    });

    it("should return the correct result", async () => {
      const expectedProcessorResult: ReconcilerProcessorResult = {
        jobsCreated: 2 * propagatorQueues.length,
        blobTimestamps: {
          firstBlob: orphanedBlobs[0]?.insertedAt,
          lastBlob: orphanedBlobs[1]?.insertedAt,
        },
      };

      expect(processorResult).toEqual(expectedProcessorResult);
    });
  });

  it("should return the correct result when no orphaned blob exists", async () => {
    const processor = reconcilerProcessor({
      batchSize: 1000,
      prisma,
      primaryBlobStorage: primaryBlobStorage,
      propagatorQueues,
    });

    const result = await processor({} as Job);

    expect(result).toEqual({
      jobsCreated: 0,
    });
  });
});
