import type { S3Client } from "@aws-sdk/client-s3";
import { beforeAll, describe, expect, it } from "vitest";

import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { S3Storage } from "../../src";
import { BlobStorageError } from "../../src/errors";
import type { S3StorageConfig } from "../../src/storages";
import { hexToBytes } from "../../src/utils";
import { NEW_BLOB_DATA, NEW_BLOB_HASH } from "../fixtures";

class S3StorageMock extends S3Storage {
  constructor(config: S3StorageConfig) {
    super(config);
  }

  closeMock() {
    // This would need to be implemented if we want to clean up test data
    return Promise.resolve();
  }

  healthCheck() {
    return super.healthCheck();
  }

  get bucketName(): string {
    return this._bucketName;
  }

  get s3Client(): S3Client {
    return this._s3Client;
  }
}

describe("S3Storage", () => {
  let storage: S3StorageMock;
  const expectedStoredBlobHash = "blobHash004";
  const expectedStoredBlobFileUri = `${
    env.CHAIN_ID
  }/${expectedStoredBlobHash.slice(2, 4)}/${expectedStoredBlobHash.slice(
    4,
    6
  )}/${expectedStoredBlobHash.slice(6, 8)}/${expectedStoredBlobHash.slice(
    2
  )}.bin`;
  const expectedStoredBlobData = "0x4fe40fc67f9c3a3ffa2be77d10fe7818";

  beforeAll(() => {
    if (!env.S3_STORAGE_BUCKET_NAME) {
      throw new Error("S3_STORAGE_BUCKET_NAME is not set");
    }

    storage = new S3StorageMock({
      chainId: env.CHAIN_ID,
      region: env.S3_STORAGE_REGION ?? "us-east-1",
      bucketName: env.S3_STORAGE_BUCKET_NAME,
      accessKeyId: env.S3_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.S3_STORAGE_SECRET_ACCESS_KEY,
      endpoint: env.S3_STORAGE_ENDPOINT,
    });
  });

  it("should create a storage", async () => {
    expect(storage, "Storage should exist").toBeDefined();
    expect(storage.chainId, "Chain ID mismatch").toEqual(env.CHAIN_ID);
    expect(storage.bucketName, "Bucket name mismatch").toEqual(
      env.S3_STORAGE_BUCKET_NAME
    );
  });

  it("should return the correct uri given a blob hash", () => {
    const blobUri = storage.getBlobUri(expectedStoredBlobHash);

    expect(blobUri).toBe(expectedStoredBlobFileUri);
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should get a blob given its reference", async () => {
    // First store the blob so we can retrieve it
    await storage.storeBlob(expectedStoredBlobHash, expectedStoredBlobData);
    
    const blob = await storage.getBlob(expectedStoredBlobFileUri);

    expect(blob).toEqual(expectedStoredBlobData);
  });

  it("should remove a blob given its reference", async () => {
    // First store the blob so we can remove it
    await storage.storeBlob(expectedStoredBlobHash, expectedStoredBlobData);
    
    await storage.removeBlob(expectedStoredBlobFileUri);

    await expect(
      storage.getBlob(expectedStoredBlobFileUri)
    ).rejects.toThrowError();
  });

  it("should not throw an error when trying to remove a non-existent blob", async () => {
    await expect(
      storage.removeBlob("non-existent-blob-uri")
    ).resolves.not.toThrow();
  });

  it("should store a blob", async () => {
    const file = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

    const blob = await storage.getBlob(file);

    expect(blob).toEqual(NEW_BLOB_DATA);
  });

  it("should return an uri when storing a blob", async () => {
    const file = await storage.storeBlob(NEW_BLOB_HASH, NEW_BLOB_DATA);

    expect(file).toEqual(
      `${env.CHAIN_ID}/01/00/ea/0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174.bin`
    );
  });

  testValidError(
    "should throw a valid error if the bucket does not exist",
    async () => {
      const nonExistentBucket = "non-existent-bucket";

      await S3Storage.create({
        chainId: env.CHAIN_ID,
        region: env.S3_STORAGE_REGION ?? "us-east-1",
        bucketName: nonExistentBucket,
        endpoint: env.S3_STORAGE_ENDPOINT,
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

      const storage = await S3Storage.create({
        chainId: env.CHAIN_ID,
        region: env.S3_STORAGE_REGION ?? "us-east-1",
        bucketName: nonExistentBucket,
        endpoint: env.S3_STORAGE_ENDPOINT,
      });

      await storage.storeBlob(expectedStoredBlobHash, expectedStoredBlobData);
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );
});
