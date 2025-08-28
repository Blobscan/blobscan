import type { JobsOptions } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WeaveVMStorage } from "@blobscan/blob-storage-manager";
import type {
  BlobStorage,
  PostgresStorage,
} from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { fixtures, testValidError } from "@blobscan/test";

import { buildJobId } from "../src";
import type { BlobPropagatorConfig } from "../src/BlobPropagator";
import { BlobPropagator } from "../src/BlobPropagator";
import { DEFAULT_JOB_OPTIONS } from "../src/constants";
import {
  BlobPropagatorCreationError,
  BlobPropagatorError,
} from "../src/errors";
import type { BlobPropagationInput } from "../src/types";
import {
  computeLinearPriority,
  createBlobPropagationJob,
  MAX_JOB_PRIORITY,
} from "../src/utils";
import { createBlobStorages } from "./helpers";

export class MockedBlobPropagator extends BlobPropagator {
  getJobPriority(blockNumber?: number) {
    return this.computeJobPriority(blockNumber);
  }
  getPropagators() {
    return this.propagators;
  }

  getReconciliator() {
    return this.reconciliator;
  }

  getHighestBlockNumber() {
    return this.highestBlockNumber;
  }

  getPrimaryBlobStorage() {
    return this.primaryBlobStorage;
  }

  setHighestBlockNumber(blockNumber?: number) {
    this.highestBlockNumber = blockNumber;
  }

  static async create(
    config: Omit<
      BlobPropagatorConfig,
      "highestBlockNumber" | "reconciliatorOpts"
    >
  ) {
    const reconciliatorOpts = {
      batchSize: 200,
      cronPattern: "*/30 * * * *",
    };

    const propagator = new MockedBlobPropagator({
      ...config,
      reconciliatorOpts,
      highestBlockNumber: fixtures.blockchainSyncState[0]?.lastFinalizedBlock,
    });

    const pattern = reconciliatorOpts?.cronPattern ?? "*/30 * * * *";

    await propagator.reconciliator.queue.add("reconciliator-job", null, {
      repeat: {
        pattern,
      },
    });

    return propagator;
  }
}

class MockedWeaveVMStorage extends WeaveVMStorage {
  constructor() {
    super({
      apiBaseUrl: "http://localhost:8000",
      chainId: 1,
    });
  }
}

describe("BlobPropagator", () => {
  let blobStorages: BlobStorage[];
  let primaryBlobStorage: PostgresStorage;

  const blob: BlobPropagationInput = {
    versionedHash: "blobVersionedHash",
    data: "0x1234abcdeff123456789ab34223a4b2c2e",
  };

  let blobPropagator: MockedBlobPropagator;

  beforeEach(async () => {
    const allBlobStorages = await createBlobStorages();

    blobStorages = allBlobStorages.filter(
      (b) => b.name !== env.PRIMARY_BLOB_STORAGE
    );
    primaryBlobStorage = allBlobStorages.find(
      (b) => b.name === env.PRIMARY_BLOB_STORAGE
    ) as PostgresStorage;

    blobPropagator = await MockedBlobPropagator.create({
      blobStorages,
      prisma,
      primaryBlobStorage,
      redisConnectionOrUri: env.REDIS_URI,
    });

    return async () => {
      await blobPropagator.close();
    };
  });

  describe("when creating a blob propagator", () => {
    it("should start reconciliator queue", async () => {
      const queue = blobPropagator.getReconciliator().queue;

      await expect(queue.isPaused()).resolves.toBeFalsy();
    });

    it("should start reconciliator worker", () => {
      const worker = blobPropagator.getReconciliator().worker;

      expect(worker.isRunning()).toBeTruthy();
    });

    it("should start reconciliator cron job", async () => {
      const jobs = (
        await blobPropagator.getReconciliator().queue.getJobs()
      ).filter((j) => !!j);

      expect(jobs.length, "more than one cron job started").toBe(1);

      const job = jobs[0];

      expect(job?.name).toBe("reconciliator-job");
    });

    it("should return an instance with the highest block number set to the last finalized block", async () => {
      const expectedHighestBlockNumber = await prisma.blockchainSyncState
        .findFirst()
        .then((s) => s?.lastFinalizedBlock);

      expect(blobPropagator.getHighestBlockNumber()).toBe(
        expectedHighestBlockNumber
      );
    });

    testValidError(
      "should throw a valid error when creating it with no blob storages",
      async () => {
        await MockedBlobPropagator.create({
          blobStorages: [],
          prisma,
          primaryBlobStorage,
          redisConnectionOrUri: env.REDIS_URI,
        });
      },
      BlobPropagatorCreationError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw a valid error when creating it with blob storages without worker processors",
      async () => {
        const weavevmStorage = new MockedWeaveVMStorage();

        await MockedBlobPropagator.create({
          blobStorages: [weavevmStorage],
          prisma,
          primaryBlobStorage,
          redisConnectionOrUri: env.REDIS_URI,
        });
      },
      BlobPropagatorCreationError,
      {
        checkCause: true,
      }
    );
  });

  describe("when storage propagator jobs", async () => {
    const flowJobBlob = fixtures.blobsOnTransactions[0];
    const expectedBlobUri = "expected-incoming-blob-uri";

    if (!flowJobBlob) {
      throw new Error("No blob to test");
    }

    let propagatorJobs: ReturnType<typeof createBlobPropagationJob>[];

    beforeEach(() => {
      propagatorJobs = blobPropagator.getPropagators().map(({ queue }) =>
        createBlobPropagationJob(
          queue.name,
          flowJobBlob.blobHash,
          expectedBlobUri,
          {
            priority: blobPropagator.getJobPriority(flowJobBlob.blockNumber),
          }
        )
      );
    });

    it("should have the correct ids", () => {
      const expectedStorageJobIds = blobPropagator
        .getPropagators()
        .map(({ queue }) => buildJobId(queue.name, flowJobBlob.blobHash));

      expect(propagatorJobs?.map((c) => c.opts?.jobId)).toEqual(
        expectedStorageJobIds
      );
    });

    it("should have the correct names", () => {
      const expectedNames = blobPropagator
        .getPropagators()
        .map(
          ({ queue }) =>
            `propagate_${buildJobId(queue.name, flowJobBlob.blobHash)}`
        );

      expect(propagatorJobs?.map((c) => c.name)).toEqual(expectedNames);
    });

    it("should have the correct queue names", () => {
      const expectedQueueNames = blobPropagator
        .getPropagators()
        .map(({ queue }) => queue.name);

      expect(propagatorJobs.map((c) => c.queueName)).toEqual(
        expectedQueueNames
      );
    });

    it("should have the correct data", () => {
      const expectedJobData = blobPropagator.getPropagators().map((_) => ({
        versionedHash: flowJobBlob.blobHash,
        blobUri: expectedBlobUri,
      }));

      expect(propagatorJobs.map((c) => c.data)).toEqual(expectedJobData);
    });

    it("should have the correct options", () => {
      const expectedOpts: JobsOptions = {
        ...DEFAULT_JOB_OPTIONS,
      };

      blobPropagator.getPropagators().map(({ queue }) => {
        const job = propagatorJobs.find((j) => j.queueName === queue.name);
        const { priority: _, jobId: __, ...restOpts } = job?.opts ?? {};
        expect(restOpts, `Opts mismatch for job ${job?.name}`).toEqual(
          expectedOpts
        );
      });
    });

    describe("when computing job priority", () => {
      it("should set the same priority for every job", () => {
        expect(propagatorJobs.every((c) => c.opts?.priority)).toBeTruthy();
      });

      it("should calculate the correct priority", () => {
        const jobPriority = propagatorJobs[0]?.opts?.priority;

        expect(
          jobPriority,
          "priority greater than maximum bullmq priority"
        ).lessThanOrEqual(MAX_JOB_PRIORITY);
        expect(jobPriority).toEqual(
          computeLinearPriority(flowJobBlob.blockNumber, {
            min: 1,
            max: blobPropagator.getHighestBlockNumber() ?? 0,
          })
        );
      });

      it("should calculate the correct priority when job block number exceeds bullmq maximum allowed priority", () => {
        const highestBlockNumber = MAX_JOB_PRIORITY * 5;
        blobPropagator.setHighestBlockNumber(highestBlockNumber);

        const blockNumber = Math.round(MAX_JOB_PRIORITY * 2.3);
        const jobPriority = blobPropagator.getJobPriority(blockNumber);

        expect(
          jobPriority,
          "priority greater than maximum bullmq priority"
        ).lessThanOrEqual(MAX_JOB_PRIORITY);
        expect(jobPriority).toBe(
          computeLinearPriority(blockNumber, { max: highestBlockNumber })
        );
      });

      it("should return highest priority when no block number is provided", () => {
        const priority = blobPropagator.getJobPriority();

        expect(priority).toBe(1);
      });

      it("should update propagator's highest block number when initially unset", () => {
        blobPropagator.setHighestBlockNumber();

        blobPropagator.getJobPriority(flowJobBlob.blockNumber);

        expect(blobPropagator.getHighestBlockNumber()).toBe(
          flowJobBlob.blockNumber
        );
      });

      it("should update highest block number when job block number exceeds it", () => {
        blobPropagator.setHighestBlockNumber(flowJobBlob.blockNumber - 1);
        blobPropagator.getJobPriority(flowJobBlob.blockNumber);

        expect(blobPropagator.getHighestBlockNumber()).toBe(
          flowJobBlob.blockNumber
        );
      });
    });
  });

  describe("when propagating a single blob", () => {
    afterEach(async () => {
      const blobUri = primaryBlobStorage.getBlobUri(blob.versionedHash);

      try {
        await primaryBlobStorage.removeBlob(blobUri);
      } catch (_) {
        /* empty */
      }
    });

    it("should store blob in primary blob storage", async () => {
      await blobPropagator.propagateBlob(blob);

      const blobUri = primaryBlobStorage.getBlobUri(blob.versionedHash);
      const storedBlob = await primaryBlobStorage.getBlob(blobUri);

      expect(storedBlob).toEqual(blob.data);
    });

    it("should create a a propagation job for every available queue", async () => {
      const propagatorSpies = blobPropagator
        .getPropagators()
        .map(({ queue }) => vi.spyOn(queue, "add"));

      await blobPropagator.propagateBlob(blob);

      propagatorSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalledOnce();
      });
    });
  });

  describe("when propagating multiple blobs", () => {
    const blobsInput: BlobPropagationInput[] = [
      {
        versionedHash: "blobVersionedHash1",
        data: "0x1234abcdeff123456789ab34223a4b2c2e",
      },
      {
        versionedHash: "blobVersionedHash2",
        data: "0x2467234ab65cff34faa230",
      },
    ];

    afterEach(async () => {
      await Promise.all(
        blobsInput.map(async (b) => {
          const blobUri = primaryBlobStorage.getBlobUri(b.versionedHash);

          try {
            await primaryBlobStorage.removeBlob(blobUri);
          } catch (_) {
            /* empty */
          }
        })
      );
    });

    it("should create flow jobs correctly", async () => {
      const propagatorSpies = blobPropagator
        .getPropagators()
        .map(({ queue }) => vi.spyOn(queue, "addBulk"));

      await blobPropagator.propagateBlobs(blobsInput);

      propagatorSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe("when closing", () => {
    let closingBlobPropagator: MockedBlobPropagator;

    beforeEach(async () => {
      closingBlobPropagator = await MockedBlobPropagator.create({
        blobStorages,
        prisma,
        primaryBlobStorage,
        redisConnectionOrUri: env.REDIS_URI,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should close correctly", async () => {
      await closingBlobPropagator.close();

      const propagators = closingBlobPropagator.getPropagators();
      const reconciliator = closingBlobPropagator.getReconciliator();
      const propagatorWorkersClosed = propagators.every(
        ({ worker }) => !worker.isRunning()
      );
      const reconciliatorWorkerClosed = !reconciliator.worker.isRunning();

      expect(propagatorWorkersClosed, "Storage workers still running").toBe(
        true
      );
      expect(
        reconciliatorWorkerClosed,
        "Reconciliator worker still running"
      ).toBe(true);
    });

    testValidError(
      "should throw a valid error when the storage worker operation fails",
      async () => {
        const storageWorker = closingBlobPropagator.getPropagators()[0]?.worker;

        if (!storageWorker) {
          throw new Error("Storage worker not found ");
        }

        vi.spyOn(storageWorker, "close").mockImplementationOnce(() => {
          throw new Error("Closing storage worker failed");
        });

        await closingBlobPropagator.close();
      },
      BlobPropagatorError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw a valid error when the reconciliator worker closing operation fails",
      async () => {
        const reconciliator = closingBlobPropagator.getReconciliator().worker;

        vi.spyOn(reconciliator, "close").mockImplementationOnce(() => {
          throw new Error("Closing reconciliator worker failed");
        });

        await closingBlobPropagator.close();
      },
      BlobPropagatorError,
      {
        checkCause: true,
      }
    );
  });
});
