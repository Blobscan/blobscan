import { describe, expect, it } from "vitest";

import {
  BLOB_DATA,
  BLOB_HASH,
  CHAIN_ID,
  FILE_URI,
  GOOGLE_STORAGE_CONFIG,
} from "../../test/constants";
import { GoogleStorageMock as GoogleStorage } from "../__mocks__/GoogleStorage";

describe("GoogleStorage", () => {
  const storage = new GoogleStorage(GOOGLE_STORAGE_CONFIG);

  describe("constructor", () => {
    it("should create a new instance with all configuration options", async () => {
      expect(storage).toBeDefined();
      expect(storage.bucketName).toEqual(GOOGLE_STORAGE_CONFIG.bucketName);
      expect(storage.storageClient.projectId).toEqual(
        GOOGLE_STORAGE_CONFIG.projectId
      );
      expect(storage.storageClient.apiEndpoint).toEqual(
        GOOGLE_STORAGE_CONFIG.apiEndpoint
      );

      const [serviceAccont] = await storage.storageClient.getServiceAccount();
      const credentials = JSON.parse(
        Buffer.from(GOOGLE_STORAGE_CONFIG.serviceKey, "base64").toString()
      );
      expect(serviceAccont.emailAddress).toEqual(credentials.client_email);
    });
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });

    it("should throw an error if the bucket does not exist", async () => {
      const newBucket = "new-bucket";

      const newStorage = new GoogleStorage({
        ...GOOGLE_STORAGE_CONFIG,
        bucketName: newBucket,
      });
      await expect(newStorage.healthCheck()).rejects.toThrowError(
        `Bucket ${newBucket} does not exist`
      );
    });
  });

  describe("buildBlobFileName", () => {
    it("should return the correct file name", () => {
      const actualFileName = storage.buildBlobFileName(CHAIN_ID, BLOB_HASH);
      expect(actualFileName).toEqual(FILE_URI);
    });
  });

  describe("getBlob", () => {
    it("should return the contents of the blob", async () => {
      const blob = await storage.getBlob(FILE_URI);

      expect(blob).toEqual(BLOB_DATA);
      expect(storage.storageClient.bucket).toHaveBeenCalledWith(
        GOOGLE_STORAGE_CONFIG.bucketName
      );
      expect(
        storage.storageClient.bucket(GOOGLE_STORAGE_CONFIG.bucketName).file
      ).toHaveBeenCalledWith(FILE_URI);
    });
  });

  describe("storeBlob", () => {
    it("should store the blob in the bucket", async () => {
      await storage.storeBlob(CHAIN_ID, BLOB_HASH, BLOB_DATA);

      expect(storage.storageClient.bucket).toHaveBeenCalledWith(
        GOOGLE_STORAGE_CONFIG.bucketName
      );
      expect(
        storage.storageClient.bucket(GOOGLE_STORAGE_CONFIG.bucketName).file
      ).toHaveBeenCalledWith(FILE_URI);
    });
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return undefined if GOOGLE_STORAGE_ENABLED is false", () => {
      const config = GoogleStorage.tryGetConfigFromEnv({
        GOOGLE_STORAGE_ENABLED: false,
      });
      expect(config).toBeUndefined();
    });

    it("should return undefined if GOOGLE_STORAGE_BUCKET_NAME is not set", () => {
      const config = GoogleStorage.tryGetConfigFromEnv({
        GOOGLE_STORAGE_ENABLED: "true",
      });
      expect(config).toBeUndefined();
    });

    it("should return undefined if GOOGLE_SERVICE_KEY and GOOGLE_STORAGE_API_ENDPOINT are not set", () => {
      const config = GoogleStorage.tryGetConfigFromEnv({
        GOOGLE_STORAGE_ENABLED: "true",
        GOOGLE_STORAGE_BUCKET_NAME: "my-bucket",
      });
      expect(config).toBeUndefined();
    });

    it("should return a config object if all required environment variables are set", () => {
      const config = GoogleStorage.tryGetConfigFromEnv({
        GOOGLE_STORAGE_ENABLED: "true",
        GOOGLE_STORAGE_BUCKET_NAME: "my-bucket",
        GOOGLE_SERVICE_KEY: "my-service-key",
        GOOGLE_STORAGE_API_ENDPOINT: "my-api-endpoint",
        GOOGLE_STORAGE_PROJECT_ID: "my-project-id",
      });
      expect(config).toEqual({
        bucketName: "my-bucket",
        projectId: "my-project-id",
        serviceKey: "my-service-key",
        apiEndpoint: "my-api-endpoint",
      });
    });
  });
});
