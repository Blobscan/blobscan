import { beforeAll, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockDeep } from "vitest-mock-extended";

import { testValidError } from "@blobscan/test";

import { GoogleStorage, PostgresStorage, env } from "../src";
import { BlobStorageManager } from "../src/BlobStorageManager";
import { SwarmStorageMock as SwarmStorage } from "../src/__mocks__";
import { BlobStorageError, BlobStorageManagerError } from "../src/errors";
import type { BlobStorageName } from "../src/types";
import {
  BLOB_DATA,
  BLOB_HASH,
  FILE_URI,
  SWARM_REFERENCE,
  SWARM_STORAGE_CONFIG,
} from "./fixtures";

describe("BlobStorageManager", () => {
  let blobStorageManager: BlobStorageManager;
  let postgresStorage: PostgresStorage;
  let googleStorage: GoogleStorage;
  let swarmStorage: SwarmStorage;

  let failingPostgresStorage: DeepMockProxy<PostgresStorage>;
  let failingGoogleStorage: DeepMockProxy<GoogleStorage>;
  let failingSwarmStorage: DeepMockProxy<SwarmStorage>;

  beforeAll(() => {
    if (!env.GOOGLE_STORAGE_BUCKET_NAME) {
      throw new BlobStorageError(
        "GoogleStorage",
        "GOOGLE_STORAGE_BUCKET_NAME is not set"
      );
    }

    postgresStorage = new PostgresStorage();
    googleStorage = new GoogleStorage({
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
    });
    swarmStorage = new SwarmStorage(SWARM_STORAGE_CONFIG);

    blobStorageManager = new BlobStorageManager(
      [postgresStorage, googleStorage, swarmStorage],
      env.CHAIN_ID
    );

    failingPostgresStorage = mockDeep<PostgresStorage>();
    failingGoogleStorage = mockDeep<GoogleStorage>();
    failingSwarmStorage = mockDeep<SwarmStorage>();

    failingPostgresStorage.storeBlob.mockRejectedValue(
      new BlobStorageError(
        "PostgresStorage",
        "Failed to upload blob to postgres"
      )
    );
    failingGoogleStorage.storeBlob.mockRejectedValue(
      new BlobStorageError("GoogleStorage", "Failed to upload blob to google")
    );
    failingSwarmStorage.storeBlob.mockRejectedValue(
      new BlobStorageError("SwarmStorage", "Failed to upload blob to swarm")
    );
  });

  describe("constructor", () => {
    it("should throw an error if no blob storages are provided", () => {
      expect(() => new BlobStorageManager([], env.CHAIN_ID)).toThrow(
        "No blob storages provided"
      );
    });

    it("should return the correct chain id", async () => {
      expect(blobStorageManager.chainId).toBe(env.CHAIN_ID);
    });
  });

  describe("getStorage", () => {
    it("should return the correct blob storage for a given name", async () => {
      expect(blobStorageManager.getStorage("POSTGRES")).toEqual(
        postgresStorage
      );

      expect(blobStorageManager.getStorage("GOOGLE")).toEqual(googleStorage);
      expect(blobStorageManager.getStorage("SWARM")).toEqual(swarmStorage);
    });
  });

  describe("getBlob", async () => {
    it("should return the blob data and storage name", async () => {
      const result = await blobStorageManager.getBlob(
        {
          reference: BLOB_HASH,
          storage: "POSTGRES",
        },
        {
          reference: FILE_URI,
          storage: "GOOGLE",
        },
        {
          reference: SWARM_REFERENCE,
          storage: "SWARM",
        }
      );

      expect([
        { data: "0x6d6f636b2d64617461", storage: "POSTGRES" },
        { data: "mock-data", storage: "GOOGLE" },
        { data: "mock-data", storage: "SWARM" },
      ]).toContainEqual(result);
    });

    testValidError(
      "should throw an error if the blob storage is not found",
      async () => {
        const UNKNOWN_BLOB_HASH = "0x6d6f636b2d64617461";
        const UNKNOWN_FILE_URI = "1/6d/6f/636b2d64617461.txt";
        const UNKNOWN_SWARM_REFERENCE = "123456789abcdef";

        await blobStorageManager.getBlob(
          {
            reference: UNKNOWN_BLOB_HASH,
            storage: "POSTGRES",
          },
          {
            reference: UNKNOWN_FILE_URI,
            storage: "GOOGLE",
          },
          {
            reference: UNKNOWN_SWARM_REFERENCE,
            storage: "SWARM",
          }
        );
      },
      BlobStorageManagerError,
      {
        checkCause: true,
      }
    );
  });

  describe("storeBlob", () => {
    const blob = { data: BLOB_DATA, versionedHash: BLOB_HASH };
    it("should store the blob in all available storages", async () => {
      const result = await blobStorageManager.storeBlob(blob);

      expect(result.references).matchSnapshot();
      expect(result.errors).toMatchSnapshot();
    });

    it("should store a blob in a specific storage if provided", async () => {
      const selectedStorage: BlobStorageName = "POSTGRES";

      const result = await blobStorageManager.storeBlob(blob, {
        selectedStorages: [selectedStorage],
      });

      const blobReference = result.references[0];

      expect(
        result.references.length,
        "Returned blob storage refs length mismatch"
      ).toBe(1);
      expect(blobReference?.reference, "Blob storage ref mismatch").toBe(
        BLOB_HASH
      );
      expect(blobReference?.storage, "Blob storage mismatch").toBe(
        selectedStorage
      );
    });

    testValidError(
      "should throw an error when one of the selected blob storages wasn't found",
      async () => {
        const selectedStorages: BlobStorageName[] = ["POSTGRES", "GOOGLE"];
        const singleStorageBSM = new BlobStorageManager(
          [swarmStorage],
          env.CHAIN_ID
        );

        await singleStorageBSM.storeBlob(blob, {
          selectedStorages: selectedStorages,
        });
      },
      BlobStorageManagerError
    );

    it("should return errors for failed uploads", async () => {
      const newHash = "0x6d6f636b2d64617461";
      const blob = { data: "New data", versionedHash: newHash };

      const blobStorageManager = new BlobStorageManager(
        [failingPostgresStorage, googleStorage, failingSwarmStorage],
        env.CHAIN_ID
      );

      const result = await blobStorageManager.storeBlob(blob);

      expect(result).toMatchSnapshot();
    });

    testValidError(
      "should throw an error if all uploads fail",
      async () => {
        const newBlobStorageManager = new BlobStorageManager(
          [failingPostgresStorage, failingGoogleStorage, failingSwarmStorage],
          env.CHAIN_ID
        );

        const blob = {
          data: "New data",
          versionedHash: "0x6d6f636b2d64617461",
        };

        await newBlobStorageManager.storeBlob(blob);
      },
      BlobStorageManagerError,
      {
        checkCause: true,
      }
    );
  });
});
