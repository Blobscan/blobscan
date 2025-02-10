import type { ConnectionOptions } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PostgresStorage,
  WeaveVMStorage,
  createStorageFromEnv,
  getBlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { BlobStorageManager } from "@blobscan/blob-storage-manager";
import type { FileSystemStorage } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { BlobPropagator } from "../src/BlobPropagator";
import {
  BlobPropagatorCreationError,
  BlobPropagatorError,
} from "../src/errors";
import type { Blob } from "../src/types";

export class MockedBlobPropagator extends BlobPropagator {
  getFinalizerWorker() {
    return this.finalizerWorker;
  }

  getStorageWorkers() {
    return this.storageWorkers;
  }

  getBlobPropagationFlowProducer() {
    return this.blobPropagationFlowProducer;
  }

  getTemporaryBlobStorage() {
    return this.temporaryBlobStorage;
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

  const connection: ConnectionOptions = {
    host: "localhost",
    port: 6379,
  };
  const blob: Blob = {
    versionedHash: "blobVersionedHash",
    data: "0x1234abcdeff123456789ab34223a4b2c2e",
  };

  let blobPropagator: MockedBlobPropagator;

  beforeEach(async () => {
    blobStorageManager = await getBlobStorageManager();
    const tmpStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    blobStorageManager.addStorage(tmpStorage);

    tmpBlobStorage = tmpStorage as FileSystemStorage;

    blobPropagator = new MockedBlobPropagator({
      blobStorageManager,
      prisma,
      tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
      workerOptions: {
        connection,
      },
    });
  });

  afterEach(async () => {
    await blobPropagator.close();
  });

  testValidError(
    "should throw a valid error when creating a blob propagator with no blob storages",
    async () => {
      const postgresStorage = await PostgresStorage.create({
        chainId: 1,
        prisma,
      });
      const emptyBlobStorageManager = new BlobStorageManager([postgresStorage]);

      emptyBlobStorageManager.removeStorage("POSTGRES");

      new MockedBlobPropagator({
        blobStorageManager: emptyBlobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
        workerOptions: {
          connection,
        },
      });
    },
    BlobPropagatorCreationError,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should throw a valid error when creating a blob propagator with blob storages without worker processors",
    () => {
      const weavevmStorage = new MockedWeaveVMStorage();

      const blobStorageManager = new BlobStorageManager([weavevmStorage]);

      new MockedBlobPropagator({
        blobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
        workerOptions: {
          connection,
        },
      });
    },
    BlobPropagatorCreationError,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should throw a valid error when creating a blob propagator with no temporary blob storage",
    async () => {
      const postgresStorage = await PostgresStorage.create({
        chainId: 1,
        prisma,
      });
      const noTmpStorageBlobStorageManager = new BlobStorageManager([
        postgresStorage,
      ]);

      new MockedBlobPropagator({
        blobStorageManager: noTmpStorageBlobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
        workerOptions: {
          connection,
        },
      });
    },
    BlobPropagatorCreationError,
    {
      checkCause: true,
    }
  );

  describe("when closing", () => {
    let closingBlobPropagator: MockedBlobPropagator;

    beforeEach(() => {
      closingBlobPropagator = new MockedBlobPropagator({
        blobStorageManager,
        prisma,
        tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
        workerOptions: {
          connection,
        },
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

      const createdFlowJob = spy.mock.calls[0]?.[0];

      expect(createdFlowJob).toMatchInlineSnapshot(`
        {
          "children": [
            {
              "data": {
                "versionedHash": "blobVersionedHash",
              },
              "name": "storeBlob:google-worker-blobVersionedHash",
              "opts": {
                "attempts": 3,
                "backoff": {
                  "delay": 1000,
                  "type": "exponential",
                },
                "jobId": "google-worker-blobVersionedHash",
                "removeDependencyOnFailure": true,
              },
              "queueName": "google-worker",
            },
            {
              "data": {
                "versionedHash": "blobVersionedHash",
              },
              "name": "storeBlob:postgres-worker-blobVersionedHash",
              "opts": {
                "attempts": 3,
                "backoff": {
                  "delay": 1000,
                  "type": "exponential",
                },
                "jobId": "postgres-worker-blobVersionedHash",
                "removeDependencyOnFailure": true,
              },
              "queueName": "postgres-worker",
            },
          ],
          "data": {
            "temporaryBlobUri": "test-blobscan-blobs/70118930558/ob/Ve/rs/obVersionedHash.txt",
          },
          "name": "propagateBlob:finalizer-worker-blobVersionedHash",
          "opts": {
            "attempts": 3,
            "backoff": {
              "delay": 1000,
              "type": "exponential",
            },
            "jobId": "finalizer-worker-blobVersionedHash",
          },
          "queueName": "finalizer-worker",
        }
      `);
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
    const blobs: Blob[] = [
      {
        versionedHash: "blobVersionedHash1",
        data: "0x1234abcdeff123456789ab34223a4b2c2e",
      },
      {
        versionedHash: "blobVersionedHash2",
        data: "0x2467234ab65cff34faa23",
      },
    ];

    afterEach(async () => {
      await Promise.all(
        blobs.map(async (b) => {
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
      await blobPropagator.propagateBlobs(blobs);

      const allBlobDataExists = (
        await Promise.all(
          blobs.map(({ versionedHash }) =>
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

      await blobPropagator.propagateBlobs(blobs);

      const createdFlowJobs = spy.mock.calls[0]?.[0];

      expect(createdFlowJobs).toMatchSnapshot();
    });

    testValidError(
      "should throw a valid error if some of the blobs failed to be stored in the temporary blob storage",
      async () => {
        const temporaryBlobStorage = blobPropagator.getTemporaryBlobStorage();
        vi.spyOn(temporaryBlobStorage, "storeBlob").mockImplementation(() => {
          throw new Error("Internal temporal blob storage error");
        });

        await blobPropagator.propagateBlobs(blobs);
      },
      BlobPropagatorError,
      {
        checkCause: true,
      }
    );
  });
});
