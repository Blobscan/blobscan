import { beforeAll, describe, expect, it } from "vitest";

import {
  BLOB_DATA,
  BLOB_HASH,
  CHAIN_ID,
  SWARM_REFERENCE,
  SWARM_STORAGE_CONFIG,
} from "../../test/fixtures";
import { SwarmStorageMock as SwarmStorage } from "../__mocks__/SwarmStorage";

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

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });

    it("should throw error if bee is not healthy", async () => {
      await expect(storage.healthCheck()).rejects.toMatchInlineSnapshot(
        "[Error: Bee is not healthy: not ok]"
      );
    });

    it("should throw error if bee debug is not healthy", async () => {
      await expect(storage.healthCheck()).rejects.toMatchInlineSnapshot(
        "[Error: Bee debug is not healthy: not ok]"
      );
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
        CHAIN_ID,
        BLOB_HASH,
        BLOB_DATA
      );

      expect(uploadReference).toEqual(SWARM_REFERENCE);
    });

    it("should throw an error if no postage batches are available", async () => {
      await expect(
        storage.storeBlob(CHAIN_ID, BLOB_HASH, BLOB_DATA)
      ).rejects.toMatchInlineSnapshot("[Error: No postage batches available]");
    });

    it("should throw an error if beeDebug endpoint is not available", async () => {
      const newStorage = new SwarmStorage({
        beeEndpoint: SWARM_STORAGE_CONFIG.beeEndpoint,
      });

      await expect(
        newStorage.storeBlob(CHAIN_ID, BLOB_HASH, BLOB_DATA)
      ).rejects.toMatchInlineSnapshot(
        "[Error: Bee debug endpoint required to get postage batches]"
      );
    });
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return undefined if SWARM_STORAGE_ENABLED is not set", () => {
      const config = SwarmStorage.tryGetConfigFromEnv({
        SWARM_STORAGE_ENABLED: false,
      });
      expect(config).toBeUndefined();
    });

    it("should return undefined if BEE_ENDPOINT is not set", () => {
      const config = SwarmStorage.tryGetConfigFromEnv({
        SWARM_STORAGE_ENABLED: "true",
      });
      expect(config).toBeUndefined();
    });

    it("should return a config object if both SWARM_STORAGE_ENABLED and BEE_ENDPOINT are set", () => {
      const config = SwarmStorage.tryGetConfigFromEnv({
        SWARM_STORAGE_ENABLED: "true",
        BEE_ENDPOINT: SWARM_STORAGE_CONFIG.beeEndpoint,
        BEE_DEBUG_ENDPOINT: SWARM_STORAGE_CONFIG.beeDebugEndpoint,
      });

      expect(config).toEqual({
        beeDebugEndpoint: SWARM_STORAGE_CONFIG.beeDebugEndpoint,
        beeEndpoint: SWARM_STORAGE_CONFIG.beeEndpoint,
      });
    });
  });
});
