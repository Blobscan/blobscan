import { beforeAll, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import { env } from "../../src";
import { SwarmStorageMock as SwarmStorage } from "../../src/__mocks__/SwarmStorage";
import { BlobStorageError } from "../../src/errors";
import { BLOB_DATA, BLOB_HASH, SWARM_REFERENCE } from "../fixtures";

if (!env.BEE_ENDPOINT) {
  throw new Error("BEE_ENDPOINT test env var is not set");
}

const BEE_ENDPOINT = env.BEE_ENDPOINT;

describe("SwarmStorage", () => {
  let storage: SwarmStorage;

  beforeAll(() => {
    storage = new SwarmStorage({
      chainId: env.CHAIN_ID,
      beeEndpoint: BEE_ENDPOINT,
      beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
    });
  });

  describe("constructor", () => {
    it("should create a new instance with the provided configuration", () => {
      expect(storage).toBeDefined();
      expect(storage.swarmClient.bee).toBeDefined();
      expect(storage.swarmClient.bee.url).toBe(env.BEE_ENDPOINT);
      expect(storage.swarmClient.beeDebug).toBeDefined();
      expect(storage.swarmClient.beeDebug?.url).toBe(env.BEE_DEBUG_ENDPOINT);
    });

    it("should not create beeDebug when beeDebugEndpoint is not set", () => {
      const newStorage = new SwarmStorage({
        chainId: env.CHAIN_ID,
        beeEndpoint: BEE_ENDPOINT,
      });

      expect(newStorage.swarmClient.beeDebug).toBeUndefined();
    });
  });

  describe("healthcheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });

    testValidError(
      "should throw error if bee is not healthy",
      async () => {
        await storage.healthCheck();
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw error if bee debug is not healthy",
      async () => {
        await storage.healthCheck();
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  describe("getBlob", () => {
    it("should return the contents of the blob", async () => {
      const blob = await storage.getBlob(SWARM_REFERENCE);

      expect(blob).toEqual(BLOB_DATA);
    });
  });

  describe("storeBlob", () => {
    it("should store the blob in the bucket", async () => {
      const uploadReference = await storage.storeBlob(BLOB_HASH, BLOB_DATA);

      expect(uploadReference).toEqual(SWARM_REFERENCE);
    });

    testValidError(
      "should throw an error if no postage batches are available",
      async () => {
        await storage.storeBlob(BLOB_HASH, BLOB_DATA);
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );

    testValidError(
      "should throw an error if the bee debug endpoint is not available",
      async () => {
        const newStorage = new SwarmStorage({
          chainId: env.CHAIN_ID,
          beeEndpoint: BEE_ENDPOINT,
        });

        await newStorage.storeBlob(BLOB_HASH, BLOB_DATA);
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return a config object correctly", () => {
      const config = SwarmStorage.getConfigFromEnv({
        CHAIN_ID: env.CHAIN_ID,
        BEE_ENDPOINT: env.BEE_ENDPOINT,
        BEE_DEBUG_ENDPOINT: env.BEE_DEBUG_ENDPOINT,
      });

      expect(config).toEqual({
        chainId: env.CHAIN_ID,
        beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
        beeEndpoint: env.BEE_ENDPOINT,
      });
    });

    testValidError(
      "should throw an error when a bee endpoint is not provided",
      () => {
        SwarmStorage.getConfigFromEnv({ CHAIN_ID: env.CHAIN_ID });
      },
      Error
    );
  });
});
