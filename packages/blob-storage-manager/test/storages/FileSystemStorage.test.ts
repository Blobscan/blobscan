import fs from "fs";
import { beforeEach, describe, expect, it } from "vitest";

import { testValidError } from "@blobscan/test";

import { BlobStorageError, env } from "../../src";
import { FileSystemStorage } from "../../src/storages/FileSystemStorage";
import { BLOB_DATA, BLOB_HASH, FILE_URI } from "../fixtures";

class FileSystemStorageMock extends FileSystemStorage {
  constructor() {
    if (!env.FILE_SYSTEM_STORAGE_PATH) {
      throw new Error("FILE_SYSTEM_STORAGE_PATH is not set");
    }

    super({
      chainId: env.CHAIN_ID,
      blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
    });
  }

  buildBlobFileName(versionedHash: string) {
    return super.buildBlobFileName(versionedHash);
  }

  closeMock() {
    if (fs.existsSync(this.blobDirPath)) {
      fs.rmdirSync(this.blobDirPath, { recursive: true });
    }
  }
}

describe("FileSystemStorage", () => {
  let storage: FileSystemStorageMock;

  beforeEach(() => {
    storage = new FileSystemStorageMock();

    return () => {
      storage.closeMock();
    };
  });

  describe("constructor", () => {
    it("should create a new instance with all configuration options", () => {
      expect(storage).toBeDefined();
      expect(storage.chainId).toEqual(env.CHAIN_ID);
      expect(storage.blobDirPath).toEqual(
        env.FILE_SYSTEM_STORAGE_PATH
      );
    });
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });
  });

  describe("getBlob", () => {
    it("should return the contents of the blob", async () => {
      const blobFilePath = storage.buildBlobFileName(BLOB_HASH);
      const blobDirPath = blobFilePath.slice(0, blobFilePath.lastIndexOf("/"));

      fs.mkdirSync(blobDirPath, { recursive: true });
      fs.writeFileSync(blobFilePath, BLOB_DATA, { encoding: "utf-8" });

      const blob = await storage.getBlob(BLOB_HASH);

      expect(blob).toEqual(BLOB_DATA);
    });

    testValidError(
      "should throw a valid error if the blob file is missing",
      async () => {
        await storage.getBlob("missing-blob");
      },
      BlobStorageError,
      { checkCause: true }
    );
  });

  describe("storeBlob", () => {
    it("should return the correct blob file reference", async () => {
      const expectedFilePath = `${env.FILE_SYSTEM_STORAGE_PATH}/${FILE_URI}`;

      const filePath = await storage.storeBlob(BLOB_HASH, BLOB_DATA);

      expect(filePath).toEqual(expectedFilePath);
    });
  });

  describe("tryGetConfigFromEnv", () => {
    testValidError(
      "should throw a valid error if the blob dir path is not set",
      () => {
        FileSystemStorageMock.getConfigFromEnv({});
      },
      BlobStorageError
    );

    it("should return a config object if all required environment variables are set", () => {
      const config = FileSystemStorageMock.getConfigFromEnv({
        CHAIN_ID: env.CHAIN_ID,
        FILE_SYSTEM_STORAGE_PATH:
          env.FILE_SYSTEM_STORAGE_PATH,
      });

      expect(config).toEqual({
        chainId: env.CHAIN_ID,
        blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
      });
    });
  });
});
