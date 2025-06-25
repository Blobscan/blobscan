import fs from "fs";
import path from "path";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BlobStorage } from "../BlobStorage";
import type { BlobStorageConfig } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import {
  createFullPermissionDirectory,
  createFullPermissionFile,
} from "../utils";

export interface FileSystemStorageConfig extends BlobStorageConfig {
  blobDirPath: string;
}

export class FileSystemStorage extends BlobStorage {
  blobDirPath: string;

  protected constructor({ blobDirPath, chainId }: FileSystemStorageConfig) {
    super(BlobStorageName.FILE_SYSTEM, chainId);

    this.blobDirPath = blobDirPath;

    createFullPermissionDirectory(this.blobDirPath);
  }

  protected async _healthCheck(): Promise<void> {
    return Promise.resolve();
  }

  protected async _getBlob(reference: string): Promise<string> {
    try {
      const blobData = await fs.promises.readFile(reference, "utf-8");

      return blobData;
    } catch (error) {
      throw new Error(`Blob file ${reference} missing: ${error}`);
    }
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const fileExists = fs.existsSync(uri);

    if (fileExists) {
      return fs.promises.unlink(uri);
    }
  }

  protected async _storeBlob(
    versionedHash: string,
    data: Buffer
  ): Promise<string> {
    const blobUri = this.getBlobUri(versionedHash);
    const blobDirPath = blobUri.slice(0, blobUri.lastIndexOf("/"));

    createFullPermissionDirectory(blobDirPath);
    createFullPermissionFile(blobUri, data.toString());

    return blobUri;
  }

  getBlobUri(hash: string) {
    const blobFilePath = `${this.chainId.toString()}/${hash.slice(
      2,
      4
    )}/${hash.slice(4, 6)}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;

    return path.join(this.blobDirPath, blobFilePath);
  }

  static async create(config: FileSystemStorageConfig) {
    try {
      const storage = new FileSystemStorage(config);
      await storage.healthCheck();
      return storage;
    } catch (err) {
      const err_ = err as Error;

      throw new StorageCreationError(
        this.name,
        err_.message,
        err_.cause as Error
      );
    }
  }
}
