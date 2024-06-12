import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import { env } from "../../src/env";
import { BlobStorageError } from "../../src/errors";
import { FileSystemStorage } from "../../src/storages/FileSystemStorage";
import { NEW_BLOB_DATA, NEW_BLOB_HASH, NEW_BLOB_FILE_URI } from "../fixtures";

class FileSystemStorageMock extends FileSystemStorage {
  constructor() {
    super({
      chainId: env.CHAIN_ID,
      blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
    });
  }

  healthCheck() {
    return super.healthCheck();
  }

  async closeMock() {
    if (fs.existsSync(this.blobDirPath)) {
      await fs.promises.rm(this.blobDirPath, {
        recursive: true,
      });
    }
  }
}

describe("FileSystemStorage", () => {
  let storage: FileSystemStorageMock;

  beforeEach(() => {
    storage = new FileSystemStorageMock();

    return async () => {
      await storage.closeMock();
    };
  });

  it("should create storage", async () => {
    const storage_ = await FileSystemStorageMock.create({
      blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
      chainId: env.CHAIN_ID,
    });

    expect(storage_, "Storage should exist").toBeDefined();
    expect(storage_.chainId, "Chain ID mistmatch").toEqual(env.CHAIN_ID);
    expect(storage_.blobDirPath, "Blob directory path mismatch").toEqual(
      env.FILE_SYSTEM_STORAGE_PATH
    );
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.not.toThrow();
  });

  it("should return the correct uri given a blob hash", () => {
    const blobFilePath = storage.getBlobUri(NEW_BLOB_HASH);

    const expectedBlobFilePath = path.join(
      storage.blobDirPath,
      `${storage.chainId.toString()}/${NEW_BLOB_HASH.slice(
        2,
        4
      )}/${NEW_BLOB_HASH.slice(4, 6)}/${NEW_BLOB_HASH.slice(
        6,
        8
      )}/${NEW_BLOB_HASH.slice(2)}.txt`
    );

    expect(blobFilePath).toEqual(expectedBlobFilePath);
  });

  describe("when getting a blob", () => {
    beforeEach(() => {
      const blobFilePath = storage.getBlobUri(NEW_BLOB_HASH);
      const blobDirs = blobFilePath.slice(0, blobFilePath.lastIndexOf("/"));

      fs.mkdirSync(blobDirs, { recursive: true });
      fs.writeFileSync(blobFilePath, NEW_BLOB_DATA, { encoding: "utf-8" });

      return () => {
        fs.rmSync(storage.blobDirPath, { recursive: true });
      };
    });

    it("should get a blob by its reference", async () => {
      const blobUri = storage.getBlobUri(NEW_BLOB_HASH);

      const blob = await storage.getBlob(blobUri);

      expect(blob).toEqual(NEW_BLOB_DATA);
    });

    testValidError(
      "should throw a valid error when getting a non-existent blob",
      async () => {
        await storage.getBlob("missing-blob");
      },
      BlobStorageError,
      { checkCause: true }
    );
  });

  describe("when removing a blob", () => {
    beforeEach(() => {
      const blobFilePath = storage.getBlobUri(NEW_BLOB_HASH);
      const blobDirs = blobFilePath.slice(0, blobFilePath.lastIndexOf("/"));

      fs.mkdirSync(blobDirs, { recursive: true });
      fs.writeFileSync(blobFilePath, NEW_BLOB_DATA, { encoding: "utf-8" });
    });

    it("should remove it by its reference", async () => {
      const blobUri = storage.getBlobUri(NEW_BLOB_HASH);

      await storage.removeBlob(blobUri);

      expect(
        fs.existsSync(blobUri),
        "Blob file should not exist after removal"
      ).toBeFalsy();
    });

    it("should not throw an error when trying to remove a non-existent blob", async () => {
      await expect(
        storage.removeBlob("non-existent-blob-uri")
      ).resolves.not.toThrow();
    });
  });

  describe("when storing a blob", () => {
    afterEach(() => {
      if (fs.existsSync(NEW_BLOB_FILE_URI)) {
        fs.rmSync(NEW_BLOB_FILE_URI);
      }
    });

    it("should store it", async () => {
      const blobReference = await storage.storeBlob(
        NEW_BLOB_HASH,
        NEW_BLOB_DATA
      );

      const fileData = fs.readFileSync(blobReference, { encoding: "utf-8" });

      expect(fileData).toEqual(NEW_BLOB_DATA);
    });

    it("should return a reference", async () => {
      const blobReference = await storage.storeBlob(
        NEW_BLOB_HASH,
        NEW_BLOB_DATA
      );

      const expectedBlobUri = storage.getBlobUri(NEW_BLOB_HASH);

      expect(blobReference).toEqual(expectedBlobUri);
    });

    it("should return the correct blob reference", async () => {
      const blobReference = await storage.storeBlob(
        NEW_BLOB_HASH,
        NEW_BLOB_DATA
      );

      const expectedBlobReference = storage.getBlobUri(NEW_BLOB_HASH);

      expect(blobReference).toEqual(expectedBlobReference);
    });
  });
});
