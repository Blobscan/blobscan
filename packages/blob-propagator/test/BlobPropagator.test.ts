import type { ConnectionOptions } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BlobStorage } from "@blobscan/db";

import { BlobPropagator } from "../src/BlobPropagator";
import { blobFileManager } from "../src/blob-file-manager";
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
  const blobStorages = Object.values(BlobStorage);
  const connection: ConnectionOptions = {
    host: "localhost",
    port: 6379,
  };
  const blob: Blob = {
    versionedHash: "blobVersionedHash",
    data: "0x1234abcdeff123456789ab34223a4b2c2e",
  };

  let blobPropagator: MockedBlobPropagator;

  beforeEach(() => {
    blobPropagator = new MockedBlobPropagator(blobStorages, {
      workerOptions: {
        connection,
      },
    });
  });

  afterEach(async () => {
    await blobPropagator.close();
  });

  it("should throw an error when trying to instantiate it with no storages", () => {
    expect(
      () => new MockedBlobPropagator([])
    ).toThrowErrorMatchingInlineSnapshot(
      '"Couldn\'t instantiate blob propagator: no storages given"'
    );
  });

  it("should close correctly", async () => {
    const testBlobPropagator = new MockedBlobPropagator(blobStorages, {
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
      blobFileManager.removeFile(blob.versionedHash);
    });

    it("should store blob data on disk", async () => {
      await blobPropagator.propagateBlob(blob);

      const fileExists = await blobFileManager.checkFileExists(
        blob.versionedHash
      );

      expect(fileExists).toBe(true);
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
              "name": "storeBlob:file_system-worker-blobVersionedHash",
              "opts": {
                "attempts": 3,
                "backoff": {
                  "delay": 1000,
                  "type": "exponential",
                },
                "jobId": "file_system-worker-blobVersionedHash",
              },
              "queueName": "file_system-worker",
            },
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
            {
              "data": {
                "versionedHash": "blobVersionedHash",
              },
              "name": "storeBlob:swarm-worker-blobVersionedHash",
              "opts": {
                "attempts": 3,
                "backoff": {
                  "delay": 1000,
                  "type": "exponential",
                },
                "jobId": "swarm-worker-blobVersionedHash",
              },
              "queueName": "swarm-worker",
            },
          ],
          "data": {
            "versionedHash": "blobVersionedHash",
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
          if (await blobFileManager.checkFileExists(b.versionedHash)) {
            blobFileManager.removeFile(b.versionedHash);
          }
        })
      );
    });

    it("should store blob data on disk", async () => {
      await blobPropagator.propagateBlobs(blobs);

      const filesExists = (
        await Promise.all(
          blobs.map((b) => blobFileManager.checkFileExists(b.versionedHash))
        )
      ).every((exists) => exists);

      expect(filesExists).toBe(true);
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
