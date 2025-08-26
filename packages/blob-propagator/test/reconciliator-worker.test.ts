import type { Job, JobNode } from "bullmq";
import { FlowProducer } from "bullmq";
import IORedis from "ioredis";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { BlobStorage } from "@blobscan/blob-storage-manager";
import type { Blob } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import type { ReconciliatorProcessorResult } from "../src";
import {
  buildJobId,
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "../src";
import { reconciliatorProcessor } from "../src/worker-processors/reconciliator";
import { createStorageFromEnv } from "./helpers";

describe("Reconciliator Worker", () => {
  let flowProducer: FlowProducer;
  let incomingBlobStorage: BlobStorage;
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

    flowProducer = new FlowProducer({
      connection,
    });

    incomingBlobStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    return async () => {
      await flowProducer.close();
    };
  });

  describe("when having orphaned blobs", () => {
    const expectedStorageWorkers = [
      STORAGE_WORKER_NAMES["GOOGLE"],
      STORAGE_WORKER_NAMES["S3"],
    ];

    let flows: JobNode[];
    let processorResult: ReconciliatorProcessorResult;

    beforeEach(async () => {
      await prisma.blob.createMany({
        data: orphanedBlobs,
      });

      const processor = reconciliatorProcessor({
        batchSize,
        finalizerWorkerName: FINALIZER_WORKER_NAME,
        flowProducer,
        prisma,
        primaryBlobStorage: incomingBlobStorage,
        storageWorkerNames: expectedStorageWorkers,
      });

      processorResult = await processor({} as Job);

      flows = await Promise.all(
        orphanedBlobs.map((b) =>
          flowProducer.getFlow({
            id: buildJobId(FINALIZER_WORKER_NAME, b.versionedHash),
            queueName: FINALIZER_WORKER_NAME,
          })
        )
      ).then((res) => res.filter((el) => !!el));

      return async () => {
        await prisma.blob.deleteMany({
          where: {
            OR: orphanedBlobs.map((b) => ({ versionedHash: b.versionedHash })),
          },
        });

        await Promise.all(
          flows.map((f) => f.job.remove({ removeChildren: true }))
        );
      };
    });

    it("should create propagation flows starting from the oldest blob", () => {
      const expectedJobIds = orphanedBlobs
        .slice(0, batchSize)
        .map((b) => buildJobId(FINALIZER_WORKER_NAME, b.versionedHash));

      const jobIds = flows.map((f) => f.job.id);

      expect(jobIds).toEqual(expectedJobIds);
    });

    it("should create propagation flows with children matching the provided storage workers", async () => {
      const expectedChildren = orphanedBlobs
        .slice(0, batchSize)
        .flatMap((b) =>
          expectedStorageWorkers.map((w) => buildJobId(w, b.versionedHash))
        );

      const childrenJobIds = flows.flatMap((f) =>
        f.children?.map((c) => c.job.id)
      );

      expect(childrenJobIds.sort()).toEqual(expectedChildren.sort());
    });

    it("should create propagation flows with the correct data", async () => {
      const expectedFlowJobsData = orphanedBlobs
        .slice(0, batchSize)
        .map((b) => ({
          jobId: buildJobId(FINALIZER_WORKER_NAME, b.versionedHash),
          data: {
            blobUri: incomingBlobStorage.getBlobUri(b.versionedHash),
          },
        }));
      const flowJobsData = flows.map((f) => ({
        jobId: f.job.id,
        data: f.job.data,
      }));

      expect(flowJobsData).toEqual(expectedFlowJobsData);
    });

    it("should return the correct result", async () => {
      const expectedProcessorResult: ReconciliatorProcessorResult = {
        flowsCreated: 2,
        blobTimestamps: {
          firstBlob: orphanedBlobs[0]?.insertedAt,
          lastBlob: orphanedBlobs[1]?.insertedAt,
        },
      };

      expect(processorResult).toEqual(expectedProcessorResult);
    });
  });

  it("should return the correct result when no orphaned blob exists", async () => {
    const processor = reconciliatorProcessor({
      batchSize: 1000,
      finalizerWorkerName: FINALIZER_WORKER_NAME,
      flowProducer,
      prisma,
      primaryBlobStorage: incomingBlobStorage,
      storageWorkerNames: Object.values(STORAGE_WORKER_NAMES),
    });

    const result = await processor({} as Job);

    expect(result).toEqual({
      flowsCreated: 0,
    });
  });
});
