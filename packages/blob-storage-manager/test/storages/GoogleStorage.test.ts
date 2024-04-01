import type { Storage } from "@google-cloud/storage";
import { beforeAll, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import { GoogleStorage, env } from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { GoogleStorageConfig } from "../../src/storages";
import { BLOB_DATA, BLOB_HASH, FILE_URI } from "../fixtures";

class GoogleStorageMock extends GoogleStorage {
  constructor(config: GoogleStorageConfig) {
    super(config);
  }

  get bucketName(): string {
    return this._bucketName;
  }

  get storageClient(): Storage {
    return this._storageClient;
  }
}

describe("GoogleStorage", () => {
  let storage: GoogleStorageMock;

  beforeAll(() => {
    if (!env.GOOGLE_STORAGE_BUCKET_NAME) {
      throw new Error("GOOGLE_STORAGE_BUCKET_NAME is not set");
    }

    storage = new GoogleStorageMock({
      chainId: env.CHAIN_ID,
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
      apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
    });
  });

  describe("constructor", () => {
    it("should create a new instance with all configuration options", async () => {
      expect(storage).toBeDefined();
      expect(storage.chainId).toEqual(env.CHAIN_ID);
      expect(storage.bucketName).toEqual(env.GOOGLE_STORAGE_BUCKET_NAME);
      expect(storage.storageClient.projectId).toEqual(
        env.GOOGLE_STORAGE_PROJECT_ID
      );
      expect(storage.storageClient.apiEndpoint).toEqual(
        env.GOOGLE_STORAGE_API_ENDPOINT
      );
    });
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });

    testValidError(
      "should throw an error if the bucket does not exist",
      async () => {
        const newBucket = "new-bucket";

        const newStorage = new GoogleStorage({
          chainId: env.CHAIN_ID,
          projectId: env.GOOGLE_STORAGE_PROJECT_ID,
          apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
          bucketName: newBucket,
        });

        await newStorage.healthCheck();
      },
      Error,
      {
        checkCause: true,
      }
    );
  });

  describe("getBlob", () => {
    it("should return the contents of the blob", async () => {
      const blob = await storage.getBlob(FILE_URI);

      expect(blob).toEqual(BLOB_DATA);
    });
  });

  describe("removeBlob", () => {
    it("should remove a blob", async () => {
      await storage.removeBlob(FILE_URI);

      await expect(storage.getBlob(FILE_URI)).rejects.toThrowError();
    });

    testValidError(
      "should throw a valid error if trying to remove a non-existent blob",
      async () => {
        await storage.removeBlob("missing-blob");
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  describe("storeBlob", () => {
    it("should return the correct file", async () => {
      const file = await storage.storeBlob(BLOB_HASH, BLOB_DATA);

      expect(file).toMatchInlineSnapshot(
        '"70118930558/01/00/ea/0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174.txt"'
      );
    });

    testValidError(
      "should throw valid error if the bucket does not exist",
      async () => {
        const newBucket = "new-bucket";

        const newStorage = new GoogleStorage({
          chainId: env.CHAIN_ID,
          projectId: env.GOOGLE_STORAGE_PROJECT_ID,
          apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
          bucketName: newBucket,
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
    testValidError(
      "should throw an error when a bucket name is not provided",
      () => {
        GoogleStorage.getConfigFromEnv({});
      },
      Error
    );

    testValidError(
      "should throw an error when a service key and an api endpoint are not provided",
      () => {
        GoogleStorage.getConfigFromEnv({
          GOOGLE_STORAGE_BUCKET_NAME: "my-bucket",
        });
      },
      Error
    );

    it("should throw an error when a service key and an api endpoint are not provided", () => {
      expect(() =>
        GoogleStorage.getConfigFromEnv({
          CHAIN_ID: env.CHAIN_ID,
          GOOGLE_STORAGE_BUCKET_NAME: "my-bucket",
        })
      ).toThrowErrorMatchingInlineSnapshot(
        '"No config variables found: no bucket name, api endpoint or service key provided"'
      );
    });

    it("should return a config object if all required environment variables are set", () => {
      const config = GoogleStorage.getConfigFromEnv({
        CHAIN_ID: env.CHAIN_ID,
        GOOGLE_STORAGE_BUCKET_NAME: "my-bucket",
        GOOGLE_SERVICE_KEY: "my-service-key",
        GOOGLE_STORAGE_API_ENDPOINT: "my-api-endpoint",
        GOOGLE_STORAGE_PROJECT_ID: "my-project-id",
      });

      expect(config).toEqual({
        bucketName: "my-bucket",
        projectId: "my-project-id",
        chainId: env.CHAIN_ID,
        serviceKey: "my-service-key",
        apiEndpoint: "my-api-endpoint",
      });
    });
  });
});
