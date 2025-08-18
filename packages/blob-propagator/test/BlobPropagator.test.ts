import type { FlowJob, JobsOptions } from "bullmq";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { WeaveVMStorage } from "@blobscan/blob-storage-manager";
import type {
  BlobStorage,
  FileSystemStorage,
} from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { fixtures, testValidError } from "@blobscan/test";

import { buildJobId, FINALIZER_WORKER_NAME } from "../src";
import type { BlobPropagatorConfig } from "../src/BlobPropagator";
import { BlobPropagator } from "../src/BlobPropagator";
import { DEFAULT_JOB_OPTIONS } from "../src/constants";
import {
  BlobPropagatorCreationError,
  BlobPropagatorError,
} from "../src/errors";
import type { BlobPropagationInput } from "../src/types";
import { computeLinearPriority, MAX_JOB_PRIORITY } from "../src/utils";
import { createBlobStorages, createStorageFromEnv } from "./helpers";

export class MockedBlobPropagator extends BlobPropagator {
  createBlobPropagationFlowJob(params: {
    blockNumber?: number;
    stagedBlobUri: string;
    versionedHash: string;
  }) {
    return super.createBlobPropagationFlowJob(params);
  }

  getFinalizerWorker() {
    return this.finalizerWorker;
  }

  getStorageWorkers() {
    return this.storageWorkers;
  }

  getReconciliator() {
    return this.reconciliator;
  }

  getBlobPropagationFlowProducer() {
    return this.blobPropagationFlowProducer;
  }

  getHighestBlockNumber() {
    return this.highestBlockNumber;
  }

  getStagingBlobStorage() {
    return this.stagingBlobStorage;
  }

  setHighestBlockNumber(blockNumber?: number) {
    this.highestBlockNumber = blockNumber;
  }

  static async create(
    config: Omit<BlobPropagatorConfig, "highestBlockNumber">
  ) {
    const { reconciliatorOpts } = config;

    const propagator = new MockedBlobPropagator({
      ...config,
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
  let stagingBlobStorage: FileSystemStorage;

  const blob: BlobPropagationInput = {
    versionedHash: "blobVersionedHash",
    data: "0x1234abcdeff123456789ab34223a4b2c2e",
  };

  let blobPropagator: MockedBlobPropagator;

  beforeEach(async () => {
    blobStorages = await createBlobStorages();

    stagingBlobStorage = (await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    )) as FileSystemStorage;

    blobPropagator = await MockedBlobPropagator.create({
      blobStorages,
      prisma,
      stagingBlobStorage,
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
          stagingBlobStorage,
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
          stagingBlobStorage,
          redisConnectionOrUri: env.REDIS_URI,
        });
      },
      BlobPropagatorCreationError,
      {
        checkCause: true,
      }
    );
  });

  describe("when creating a blob propagation flow job", async () => {
    const flowJobBlob = fixtures.blobsOnTransactions[0];
    const expectedStagedBlobUri = "expected-staged-blob-uri";

    if (!flowJobBlob) {
      throw new Error("No blob to test");
    }

    let flowJob: FlowJob;

    beforeAll(() => {
      flowJob = blobPropagator.createBlobPropagationFlowJob({
        blockNumber: flowJobBlob.blockNumber,
        stagedBlobUri: expectedStagedBlobUri,
        versionedHash: flowJobBlob.blobHash,
      });
    });

    it("should have the correct queue name", () => {
      expect(flowJob.queueName).toBe(FINALIZER_WORKER_NAME);
    });

    it("should have the correct data", () => {
      expect(flowJob.data).toEqual({
        stagedBlobUri: expectedStagedBlobUri,
      });
    });

    it("should have the correct id", () => {
      const expectedJobId = buildJobId(
        blobPropagator.getFinalizerWorker().name,
        flowJobBlob.blobHash
      );
      expect(flowJob.opts?.jobId).toBe(expectedJobId);
    });

    it("should have the correct name", () => {
      const expectedJobId = buildJobId(
        blobPropagator.getFinalizerWorker().name,
        flowJobBlob.blobHash
      );
      expect(flowJob.name).toBe(`propagateBlob:${expectedJobId}`);
    });

    it("should have the correct options", () => {
      const expectedOpts: JobsOptions = DEFAULT_JOB_OPTIONS;

      const { jobId: _, ...opts } = flowJob.opts ?? {};

      expect(opts).toEqual(expectedOpts);
    });

    describe("when creating storage jobs", () => {
      it("should have the correct ids", () => {
        const expectedStorageJobIds = blobPropagator
          .getStorageWorkers()
          .map((w) => buildJobId(w.name, flowJobBlob.blobHash));

        expect(flowJob.children?.map((c) => c.opts?.jobId)).toEqual(
          expectedStorageJobIds
        );
      });

      it("should have the correct names", () => {
        const expectedNames = blobPropagator
          .getStorageWorkers()
          .map((w) => `storeBlob:${buildJobId(w.name, flowJobBlob.blobHash)}`);

        expect(flowJob.children?.map((c) => c.name)).toEqual(expectedNames);
      });

      it("should have the correct queue names", () => {
        const expectedQueueNames = blobPropagator
          .getStorageWorkers()
          .map((w) => w.name);

        expect(flowJob.children?.map((c) => c.queueName)).toEqual(
          expectedQueueNames
        );
      });

      it("should have the correct data", () => {
        const expectedJobData = blobPropagator.getStorageWorkers().map((_) => ({
          versionedHash: flowJobBlob.blobHash,
          stagedBlobUri: expectedStagedBlobUri,
        }));

        expect(flowJob.children?.map((c) => c.data)).toEqual(expectedJobData);
      });

      it("should have the correct options", () => {
        const expectedOpts: JobsOptions = {
          ...DEFAULT_JOB_OPTIONS,
          removeDependencyOnFailure: true,
        };

        blobPropagator.getStorageWorkers().map((w) => {
          const job = flowJob.children?.find((j) => j.queueName === w.name);
          const { priority: _, jobId: __, ...restOpts } = job?.opts ?? {};
          expect(restOpts, `Opts mismatch for job ${job?.name}`).toEqual(
            expectedOpts
          );
        });
      });

      describe("when computing job priority", () => {
        it("should set the same priority for every job", () => {
          expect(flowJob.children?.every((c) => c.opts?.priority)).toBeTruthy();
        });

        it("should calculate the correct priority", () => {
          const jobPriority = flowJob.children
            ? flowJob.children[0]?.opts?.priority
            : undefined;

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
          const j = blobPropagator.createBlobPropagationFlowJob({
            versionedHash: "",
            stagedBlobUri: "",
            blockNumber,
          });
          const jobPriority = j.children
            ? j.children[0]?.opts?.priority
            : undefined;

          expect(
            jobPriority,
            "priority greater than maximum bullmq priority"
          ).lessThanOrEqual(MAX_JOB_PRIORITY);
          expect(jobPriority).toBe(
            computeLinearPriority(blockNumber, { max: highestBlockNumber })
          );
        });

        it("should update propagator's highest block number if no block number is provided", () => {
          const j = blobPropagator.createBlobPropagationFlowJob({
            stagedBlobUri: "",
            versionedHash: flowJobBlob.blobHash,
          });
          blobPropagator.getStorageWorkers().forEach((w) => {
            expect(
              j.children?.find((c) => c.queueName === w.name)?.opts?.priority,
              `${w.name} priority mismatch`
            ).toEqual(1);
          });
        });

        it("should update propagator's highest block number when initially unset", () => {
          blobPropagator.setHighestBlockNumber();

          blobPropagator.createBlobPropagationFlowJob({
            versionedHash: flowJobBlob.blobHash,
            blockNumber: flowJobBlob.blockNumber,
            stagedBlobUri: "",
          });

          expect(blobPropagator.getHighestBlockNumber()).toBe(
            flowJobBlob.blockNumber
          );
        });

        it("should update highest block number when job block number exceeds it", () => {
          const higherBlockNumber =
            (blobPropagator.getHighestBlockNumber() ?? 0) + 1;
          blobPropagator.createBlobPropagationFlowJob({
            versionedHash: flowJobBlob.blobHash,
            blockNumber: higherBlockNumber,
            stagedBlobUri: "",
          });

          expect(blobPropagator.getHighestBlockNumber()).toBe(
            higherBlockNumber
          );
        });
      });
    });
  });

  describe("when propagating a single blob", () => {
    afterEach(async () => {
      const blobUri = stagingBlobStorage.getBlobUri(blob.versionedHash);

      try {
        await stagingBlobStorage.removeBlob(blobUri);
      } catch (_) {
        /* empty */
      }
    });

    it("should store blob data on staging blob storage", async () => {
      await blobPropagator.propagateBlob(blob);

      const blobUri = stagingBlobStorage.getStagedBlobUri(blob.versionedHash);
      const blobData = await stagingBlobStorage.getBlob(blobUri);

      expect(blobData).toEqual(blob.data);
    });

    it("should create a blob propagation flow job correctly", async () => {
      const propagatorFlowProducer =
        blobPropagator.getBlobPropagationFlowProducer();

      const spy = vi.spyOn(propagatorFlowProducer, "add");

      await blobPropagator.propagateBlob(blob);

      expect(spy).toHaveBeenCalledOnce();
    });

    testValidError(
      "should throw a valid error if the blob failed to get staged",
      async () => {
        const stagingBlobStorage = blobPropagator.getStagingBlobStorage();

        vi.spyOn(stagingBlobStorage, "stageBlob").mockImplementationOnce(() => {
          throw new Error("Internal temporary blob storage error");
        });

        await blobPropagator.propagateBlob(blob);
      },
      BlobPropagatorError,
      { checkCause: true }
    );
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
          const blobUri = stagingBlobStorage.getBlobUri(b.versionedHash);

          try {
            await stagingBlobStorage.removeBlob(blobUri);
          } catch (_) {
            /* empty */
          }
        })
      );
    });

    it("should stage all blobs", async () => {
      await blobPropagator.propagateBlobs(blobsInput);

      const allBlobDataExists = (
        await Promise.all(
          blobsInput.map(({ versionedHash }) =>
            stagingBlobStorage.getBlob(
              stagingBlobStorage.getStagedBlobUri(versionedHash)
            )
          )
        )
      ).every((blobData) => !!blobData);

      expect(allBlobDataExists).toBe(true);
    });

    it("should create flow jobs correctly", async () => {
      const blobPropagationFlowProducer =
        blobPropagator.getBlobPropagationFlowProducer();

      const spy = vi.spyOn(blobPropagationFlowProducer, "addBulk");

      await blobPropagator.propagateBlobs(blobsInput);

      expect(spy).toHaveBeenCalled();
    });

    testValidError(
      "should throw a valid error if some of the blobs failed to be stored in the staging blob storage",
      async () => {
        const stagingBlobStorage = blobPropagator.getStagingBlobStorage();
        vi.spyOn(stagingBlobStorage, "stageBlob").mockImplementation(() => {
          throw new Error("Internal temporal blob storage error");
        });

        await blobPropagator.propagateBlobs(blobsInput);
      },
      BlobPropagatorError,
      {
        checkCause: true,
      }
    );
  });

  describe("when closing", () => {
    let closingBlobPropagator: MockedBlobPropagator;

    beforeEach(async () => {
      closingBlobPropagator = await MockedBlobPropagator.create({
        blobStorages,
        prisma,
        stagingBlobStorage,
        redisConnectionOrUri: env.REDIS_URI,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should close correctly", async () => {
      // Flow producer doesn't have a running state, so we need to spy on its close method
      const flowProducer =
        closingBlobPropagator.getBlobPropagationFlowProducer();
      const flowProducerCloseSpy = vi.spyOn(flowProducer, "close");

      await closingBlobPropagator.close();

      const finalizerClosed = !closingBlobPropagator
        .getFinalizerWorker()
        .isRunning();
      const storageWorkersClosed = Object.values(
        closingBlobPropagator.getStorageWorkers()
      ).every((worker) => !worker.isRunning());

      expect(finalizerClosed, "Finalizer worker still running").toBe(true);
      expect(storageWorkersClosed, "Storage workers still running").toBe(true);
      expect(
        flowProducerCloseSpy,
        "Flow producer still running"
      ).toHaveBeenCalled();
    });

    testValidError(
      "should throw a valid error when the storage worker operation fails",
      async () => {
        const storageWorker = closingBlobPropagator.getStorageWorkers()[0];

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
      "should throw a valid error when the finalizer worker closing operation fails",
      async () => {
        const finalizer = closingBlobPropagator.getFinalizerWorker();

        vi.spyOn(finalizer, "close").mockImplementationOnce(() => {
          throw new Error("Closing finalizer worker failed");
        });

        await closingBlobPropagator.close();
      },
      BlobPropagatorError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw a valid error when the flow producer closing operation fails",
      async () => {
        const flowProducer =
          closingBlobPropagator.getBlobPropagationFlowProducer();

        vi.spyOn(flowProducer, "close").mockImplementationOnce(() => {
          throw new Error("Closing flow producer failed");
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
