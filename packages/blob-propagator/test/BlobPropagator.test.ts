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

import {
  PostgresStorage,
  WeaveVMStorage,
} from "@blobscan/blob-storage-manager";
import { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { FileSystemStorage } from "@blobscan/blob-storage-manager";
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
import { createBlobStorageManager, createStorageFromEnv } from "./helpers";

export class MockedBlobPropagator extends BlobPropagator {
  createBlobPropagationFlowJob(params: {
    blockNumber?: number;
    temporalBlobUri: string;
    versionedHash: string;
  }) {
    return super.createBlobPropagationFlowJob(params);
  }

  getBlobRetentionMode() {
    return this.blobRetentionMode;
  }

  getFinalizerWorker() {
    return this.finalizerWorker;
  }

  getStorageWorkers() {
    return this.storageWorkers;
  }

  getBlobPropagationFlowProducer() {
    return this.blobPropagationFlowProducer;
  }

  getHighestBlockNumber() {
    return this.highestBlockNumber;
  }

  getTemporaryBlobStorage() {
    return this.temporaryBlobStorage;
  }

  setHighestBlockNumber(blockNumber?: number) {
    this.highestBlockNumber = blockNumber;
  }

  static async create(
    config: Omit<BlobPropagatorConfig, "highestBlockNumber">
  ) {
    return new MockedBlobPropagator({
      ...config,
      highestBlockNumber: fixtures.blockchainSyncState[0]?.lastFinalizedBlock,
    });
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
  let blobStorageManager: BlobStorageManager;
  let tmpBlobStorage: FileSystemStorage;

  const blob: BlobPropagationInput = {
    versionedHash: "blobVersionedHash",
    data: "0x1234abcdeff123456789ab34223a4b2c2e",
  };

  let blobPropagator: MockedBlobPropagator;

  beforeEach(async () => {
    blobStorageManager = await createBlobStorageManager();

    const tmpStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    blobStorageManager.addStorage(tmpStorage);

    tmpBlobStorage = tmpStorage as FileSystemStorage;

    blobPropagator = await MockedBlobPropagator.create({
      blobRetentionMode: env.BLOB_PROPAGATOR_BLOB_RETENTION_MODE,
      blobStorageManager,
      prisma,
      tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
      redisConnectionOrUri: env.REDIS_URI,
    });

    return async () => {
      await blobPropagator.close();
    };
  });

  describe("when creating a blob propagator", () => {
    it("should return an instance", async () => {
      await expect(
        BlobPropagator.create({
          blobRetentionMode: env.BLOB_PROPAGATOR_BLOB_RETENTION_MODE,
          blobStorageManager,
          prisma,
          tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
          redisConnectionOrUri: env.REDIS_URI,
        })
      ).resolves.toBeDefined();
    });

    it("should return an instance with the highest block number set to the last finalized block", async () => {
      const propagator = await MockedBlobPropagator.create({
        blobRetentionMode: env.BLOB_PROPAGATOR_BLOB_RETENTION_MODE,
        blobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
        redisConnectionOrUri: env.REDIS_URI,
      });

      const expectedHighestBlockNumber = await prisma.blockchainSyncState
        .findFirst()
        .then((s) => s?.lastFinalizedBlock);

      expect(propagator.getHighestBlockNumber()).toBe(
        expectedHighestBlockNumber
      );
    });

    testValidError(
      "should throw a valid error when creating it with no blob storages",
      async () => {
        const postgresStorage = await PostgresStorage.create({
          chainId: 1,
          prisma,
        });
        const emptyBlobStorageManager = new BlobStorageManager([
          postgresStorage,
        ]);

        emptyBlobStorageManager.removeStorage("POSTGRES");

        await MockedBlobPropagator.create({
          blobStorageManager: emptyBlobStorageManager,
          prisma,
          tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
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

        const blobStorageManager = new BlobStorageManager([weavevmStorage]);

        await MockedBlobPropagator.create({
          blobStorageManager,
          prisma,
          tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
          redisConnectionOrUri: env.REDIS_URI,
        });
      },
      BlobPropagatorCreationError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw a valid error when creating it with no temporary blob storage",
      async () => {
        const postgresStorage = await PostgresStorage.create({
          chainId: 1,
          prisma,
        });
        const noTmpStorageBlobStorageManager = new BlobStorageManager([
          postgresStorage,
        ]);

        await MockedBlobPropagator.create({
          blobStorageManager: noTmpStorageBlobStorageManager,
          prisma,
          tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
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

    if (!flowJobBlob) {
      throw new Error("No blob to test");
    }

    let flowJob: FlowJob;

    beforeAll(() => {
      flowJob = blobPropagator.createBlobPropagationFlowJob({
        blockNumber: flowJobBlob.blockNumber,
        temporalBlobUri: tmpBlobStorage.getBlobUri(flowJobBlob.blobHash),
        versionedHash: flowJobBlob.blobHash,
      });
    });

    it("should have the correct queue name", () => {
      expect(flowJob.queueName).toBe(FINALIZER_WORKER_NAME);
    });

    it("should have the correct data", () => {
      expect(flowJob.data).toEqual({
        temporaryBlobUri: tmpBlobStorage.getBlobUri(flowJobBlob.blobHash),
        blobRetentionMode: env.BLOB_PROPAGATOR_BLOB_RETENTION_MODE,
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
          blobRetentionMode: env.BLOB_PROPAGATOR_BLOB_RETENTION_MODE,
          versionedHash: flowJobBlob.blobHash,
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
            temporalBlobUri: "",
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
            temporalBlobUri: "",
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
            temporalBlobUri: "",
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
            temporalBlobUri: "",
          });

          expect(blobPropagator.getHighestBlockNumber()).toBe(
            higherBlockNumber
          );
        });
      });
      // it("should have the correct job names", () => {
      //   const expectedStorageJobNames = blobPropagator
      //     .getStorageWorkers()
      //     .map((w) => `propagateBlob:${w.name}`);
      // });
    });
  });

  describe("when propagating a single blob", () => {
    afterEach(async () => {
      const blobUri = tmpBlobStorage.getBlobUri(blob.versionedHash);

      try {
        await tmpBlobStorage.removeBlob(blobUri);
      } catch (_) {
        /* empty */
      }
    });

    it("should store blob data on temporary blob storage", async () => {
      await blobPropagator.propagateBlob(blob);

      const blobUri = tmpBlobStorage.getBlobUri(blob.versionedHash);
      const blobData = await tmpBlobStorage.getBlob(blobUri);

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
      "should throw a valid error if the blob failed to be stored in the temporary blob storage",
      async () => {
        const temporaryBlobStorage = blobPropagator.getTemporaryBlobStorage();

        vi.spyOn(temporaryBlobStorage, "storeBlob").mockImplementationOnce(
          () => {
            throw new Error("Internal temporary blob storage error");
          }
        );

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
          const blobUri = tmpBlobStorage.getBlobUri(b.versionedHash);

          try {
            await tmpBlobStorage.removeBlob(blobUri);
          } catch (_) {
            /* empty */
          }
        })
      );
    });

    it("should store all blobs data in temporary blob storage", async () => {
      await blobPropagator.propagateBlobs(blobsInput);

      const allBlobDataExists = (
        await Promise.all(
          blobsInput.map(({ versionedHash }) =>
            tmpBlobStorage.getBlob(tmpBlobStorage.getBlobUri(versionedHash))
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
      "should throw a valid error if some of the blobs failed to be stored in the temporary blob storage",
      async () => {
        const temporaryBlobStorage = blobPropagator.getTemporaryBlobStorage();
        vi.spyOn(temporaryBlobStorage, "storeBlob").mockImplementation(() => {
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
        blobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
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
