import { beforeAll, describe, expect, it } from "vitest";

import { expectValidError } from "@blobscan/test";

import { env } from "../../src";
import { SwarmStorageMock as SwarmStorage } from "../../src/__mocks__/SwarmStorage";
import { BlobStorageError } from "../../src/errors";
import {
  BLOB_DATA,
  BLOB_HASH,
  SWARM_REFERENCE,
  SWARM_STORAGE_CONFIG,
} from "../fixtures";

describe("SwarmStorage", () => {
  let storage: SwarmStorage;

  beforeAll(() => {
    storage = new SwarmStorage(SWARM_STORAGE_CONFIG);
  });

  describe("constructor", () => {
    it("should create a new instance with the provided configuration", () => {
      expect(storage).toBeDefined();
      expect(storage.swarmClient.bee).toBeDefined();
      expect(storage.swarmClient.bee.url).toBe(
        SWARM_STORAGE_CONFIG.beeEndpoint
      );
      expect(storage.swarmClient.beeDebug).toBeDefined();
      expect(storage.swarmClient.beeDebug?.url).toBe(
        SWARM_STORAGE_CONFIG.beeDebugEndpoint
      );
    });

    it("should not create beeDebug when beeDebugEndpoint is not set", () => {
      const newStorage = new SwarmStorage({
        beeEndpoint: SWARM_STORAGE_CONFIG.beeEndpoint,
      });

      expect(newStorage.swarmClient.beeDebug).toBeUndefined();
    });
  });

  describe("healthcheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });

    it("should throw error if bee is not healthy", async () => {
      await expectValidError(() => storage.healthCheck(), BlobStorageError, {
        checkCause: true,
      });
    });

    it("should throw error if bee debug is not healthy", async () => {
      await expectValidError(() => storage.healthCheck(), BlobStorageError, {
        checkCause: true,
      });
    });
  });

  describe("getBlob", () => {
    it("should return the contents of the blob", async () => {
      const blob = await storage.getBlob(SWARM_REFERENCE);

      expect(blob).toEqual(BLOB_DATA);
    });
  });

  describe("storeBlob", () => {
    it("should store the blob in the bucket", async () => {
      const uploadReference = await storage.storeBlob(
        env.CHAIN_ID,
        BLOB_HASH,
        BLOB_DATA
      );

      expect(uploadReference).toEqual(SWARM_REFERENCE);
    });

    it("should throw an error if no postage batches are available", async () => {
      await expectValidError(
        () => storage.storeBlob(env.CHAIN_ID, BLOB_HASH, BLOB_DATA),
        BlobStorageError,
        {
          checkCause: true,
        }
      );
    });

    it("should throw an error if the bee debug endpoint is not available", async () => {
      const newStorage = new SwarmStorage({
        beeEndpoint: SWARM_STORAGE_CONFIG.beeEndpoint,
      });

      await expectValidError(
        () => newStorage.storeBlob(env.CHAIN_ID, BLOB_HASH, BLOB_DATA),
        BlobStorageError,
        {
          checkCause: true,
        }
      );
    });
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return a config object correctly", () => {
      const config = SwarmStorage.getConfigFromEnv({
        BEE_ENDPOINT: SWARM_STORAGE_CONFIG.beeEndpoint,
        BEE_DEBUG_ENDPOINT: SWARM_STORAGE_CONFIG.beeDebugEndpoint,
      });

      expect(config).toEqual({
        beeDebugEndpoint: SWARM_STORAGE_CONFIG.beeDebugEndpoint,
        beeEndpoint: SWARM_STORAGE_CONFIG.beeEndpoint,
      });
    });

    it("should throw an error when a bee endpoint is not provided", () => {
      expectValidError(
        () => SwarmStorage.getConfigFromEnv({}),
        BlobStorageError
      );
    });
  });
});
