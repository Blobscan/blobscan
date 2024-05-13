import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures, testValidError } from "@blobscan/test";

import { env } from "../../src/env";
import { SwarmStorage } from "../../src/storages/SwarmStorage";
import type { SwarmStorageConfig } from "../../src/storages/SwarmStorage";
import { NEW_BLOB_DATA, NEW_BLOB_HASH, SWARM_REFERENCE } from "../fixtures";

class SwarmStorageMock extends SwarmStorage {
  constructor(config: SwarmStorageConfig) {
    super(config);
  }

  get swarmClient() {
    return this._swarmClient;
  }

  healthCheck() {
    return super.healthCheck();
  }
}

describe("SwarmStorage", () => {
  let storage: SwarmStorageMock;
  const beeEndpoint = "bee-endpoint";
  const beeDebugEndpoint = "bee-debug-endpoint";

  beforeEach(async () => {
    storage = new SwarmStorageMock({
      chainId: env.CHAIN_ID,
      batchId: "mock-batch-id",
      beeEndpoint: beeEndpoint,
      beeDebugEndpoint: beeDebugEndpoint,
    });
  });

  it("should create a storage", async () => {
    const storage_ = await SwarmStorage.create({
      chainId: env.CHAIN_ID,
      beeEndpoint: beeEndpoint,
      prisma,
      beeDebugEndpoint: beeDebugEndpoint,
    });

    expect(storage_, "Storage should exists").toBeDefined();
    expect(storage_.chainId, "Chain ID mismatch").toBe(env.CHAIN_ID);
    expect(storage_._swarmClient.bee, "Bee client should exists").toBeDefined();
    expect(storage_._swarmClient.bee.url, "Bee client endpoint mismatch").toBe(
      beeEndpoint
    );
    expect(
      storage_._swarmClient.beeDebug,
      "Bee client should exists"
    ).toBeDefined();
    expect(
      storage_._swarmClient.beeDebug?.url,
      "Bee debug client endpoint mismatch"
    ).toBe(beeDebugEndpoint);
    expect(storage_.batchId, "Batch ID mismatch").toBe(
      fixtures.blobStoragesState[0]?.swarmDataId
    );
  });

  it("should not create the beeDebug client when beeDebugEndpoint is not provided", async () => {
    const storage_ = await SwarmStorage.create({
      chainId: env.CHAIN_ID,
      beeEndpoint: beeEndpoint,
      prisma,
    });

    expect(storage_._swarmClient.beeDebug).toBeUndefined();
  });

  it("should return undefined when trying to get an uri given a blob hash", () => {
    const uri = storage.getBlobUri("blob-hash");

    expect(uri).toBeUndefined();
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  testValidError(
    "should throw a valid error if bee client is not healthy",
    async () => {
      vi.spyOn(
        storage.swarmClient.bee,
        "checkConnection"
      ).mockRejectedValueOnce(new Error("Bee is not healthy: not ok"));

      await storage.healthCheck();
    },
    Error,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should throw valid error if bee debug client is not healthy",
    async () => {
      vi.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        storage.swarmClient.beeDebug!,
        "getHealth"
      ).mockRejectedValueOnce(new Error("Bee debug is not healthy: not ok"));
      await storage.healthCheck();
    },
    Error,
    {
      checkCause: true,
    }
  );

  it("should get a blob given its reference", async () => {
    await storage._swarmClient.bee.uploadFile("mock-batch-id", NEW_BLOB_DATA);

    const blob = await storage.getBlob(SWARM_REFERENCE);

    expect(blob).toEqual(NEW_BLOB_DATA);
  });

  it("should remove a blob given its reference", async () => {
    const ref = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);
    await storage.removeBlob(ref);

    await expect(storage.getBlob(ref)).rejects.toThrowError();
  });

  it("should not throw an error when trying to remove a non-existent blob", async () => {
    await expect(
      storage.removeBlob("non-existent-blob-uri")
    ).resolves.not.toThrow();
  });

  it("should store a blob", async () => {
    const uploadReference = await storage.storeBlob(
      NEW_BLOB_HASH,
      NEW_BLOB_DATA
    );

    expect(uploadReference).toEqual(SWARM_REFERENCE);
  });
});
