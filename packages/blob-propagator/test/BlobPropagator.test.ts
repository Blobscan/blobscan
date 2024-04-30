import type { ConnectionOptions } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BlobStorageManager,
  FileSystemStorage,
  createStorageFromEnv,
  getBlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";

import { env } from "../src";
import { BlobPropagator } from "../src/BlobPropagator";
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
    const [tmpStorage] = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    if (tmpStorage) {
      blobStorageManager.addStorage(tmpStorage);
    }

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

  it("should close correctly", async () => {
    const testBlobPropagator = new MockedBlobPropagator({
      blobStorageManager,
      prisma,
      tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
      workerOptions: {
        connection,
      },
    });
    // Flow producer doesn't have a running state, so we need to spy on its close method
    const flowProducer = testBlobPropagator.getBlobPropagationFlowProducer();
    const flowProducerCloseSpy = vi.spyOn(flowProducer, "close");

    await testBlobPropagator.close();

    const finalizerClosed = !testBlobPropagator
      .getFinalizerWorker()
      .isRunning();
    const storageWorkersClosed = Object.values(
      testBlobPropagator.getStorageWorkers()
    ).every((worker) => !worker.isRunning());

    expect(finalizerClosed, "Finalizer worker still running").toBe(true);
    expect(storageWorkersClosed, "Storage workers still running").toBe(true);
    expect(
      flowProducerCloseSpy,
      "Flow producer still running"
    ).toHaveBeenCalled();
  });

  describe("when propagating a single blob", () => {
    afterEach(async () => {
      const blobUri = tmpBlobStorage.getBlobUri(blob.versionedHash);

      tmpBlobStorage.removeBlob(blobUri);
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

          await tmpBlobStorage.removeBlob(blobUri);
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
  });
});
