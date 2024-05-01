import type { Storage } from "@google-cloud/storage";
import { beforeAll, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import { GoogleStorage, env } from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { GoogleStorageConfig } from "../../src/storages";
import { NEW_BLOB_DATA, NEW_BLOB_HASH } from "../fixtures";

class GoogleStorageMock extends GoogleStorage {
  constructor(config: GoogleStorageConfig) {
    super(config);
  }

  closeMock() {
    return this.storageClient.bucket(this.bucketName).deleteFiles();
  }

  healthCheck() {
    return super.healthCheck();
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
  const expectedStoredBlobHash = "blobHash004";
  const expectedStoredBlobFileUri = `${
    env.CHAIN_ID
  }/${expectedStoredBlobHash.slice(2, 4)}/${expectedStoredBlobHash.slice(
    4,
    6
  )}/${expectedStoredBlobHash.slice(6, 8)}/${expectedStoredBlobHash.slice(
    2
  )}.txt`;
  const expectedStoredBlobData = "0x4fe40fc67f9c3a3ffa2be77d10fe7818";

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

  it("should create a storage", async () => {
    expect(storage, "Storage should exists").toBeDefined();
    expect(storage.chainId, "Chain ID mismatch").toEqual(env.CHAIN_ID);
    expect(storage.bucketName, "Bucket name mismatch").toEqual(
      env.GOOGLE_STORAGE_BUCKET_NAME
    );
    expect(storage.storageClient.projectId, "Project ID mismatch").toEqual(
      env.GOOGLE_STORAGE_PROJECT_ID
    );
    expect(
      storage.storageClient.apiEndpoint,
      "GCS client endpoint mismatch"
    ).toEqual(env.GOOGLE_STORAGE_API_ENDPOINT);
  });

  it("should return the correct uri given a blob hash", () => {
    const blobUri = storage.getBlobUri(expectedStoredBlobHash);

    expect(blobUri).toBe(expectedStoredBlobFileUri);
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should get a blob given its reference", async () => {
    await storage.storageClient
      .bucket(storage.bucketName)
      .file(expectedStoredBlobFileUri)
      .save(expectedStoredBlobData);

    const blob = await storage.getBlob(expectedStoredBlobFileUri);

    expect(blob).toEqual(expectedStoredBlobData);
  });

  it("should remove a blob given its reference", async () => {
    await storage.removeBlob(expectedStoredBlobFileUri);

    await expect(
      storage.getBlob(expectedStoredBlobFileUri)
    ).rejects.toThrowError();
  });

  it("should store a blob", async () => {
    const file = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

    const blob = await storage.getBlob(file);

    expect(blob).toEqual(NEW_BLOB_DATA);
  });

  it("should return an uri when storing a blob", async () => {
    const file = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

    expect(file).toMatchInlineSnapshot(
      '"70118930558/01/00/ea/0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174.txt"'
    );
  });

  testValidError(
    "should throw a valid error if the bucket does not exist",
    async () => {
      const nonExistentBucket = "non-existent-bucket";

      await GoogleStorage.create({
        chainId: env.CHAIN_ID,
        projectId: env.GOOGLE_STORAGE_PROJECT_ID,
        apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
        bucketName: nonExistentBucket,
      });
    },
    Error,
    {
      checkCause: true,
    }
  );

  testValidError(
    "should throw a valid error when trying to get a non-existent blob",
    async () => {
      await storage.getBlob("missing-blob");
    },
    BlobStorageError,
    { checkCause: true }
  );

  testValidError(
    "should throw valid error if the bucket does not exist",
    async () => {
      const nonExistentBucket = "non-existent-bucket";

      const storage = await GoogleStorage.create({
        chainId: env.CHAIN_ID,
        projectId: env.GOOGLE_STORAGE_PROJECT_ID,
        apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
        bucketName: nonExistentBucket,
      });

      await storage.storeBlob(expectedStoredBlobHash, expectedStoredBlobData);
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );
});
