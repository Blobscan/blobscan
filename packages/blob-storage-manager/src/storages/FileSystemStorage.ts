import fs from "fs";
import path from "path";

import { BlobStorage } from "../BlobStorage";
import type { BlobStorageConfig } from "../BlobStorage";
import type { Environment } from "../env";
import { BlobStorageError } from "../errors";
import { BLOB_STORAGE_NAMES } from "../utils";

export interface FileSystemStorageConfig extends BlobStorageConfig {
  blobDirPath: string;
}

export class FileSystemStorage extends BlobStorage {
  blobDirPath: string;

  constructor({ blobDirPath, chainId }: FileSystemStorageConfig) {
    super(BLOB_STORAGE_NAMES.FILE_SYSTEM, chainId);

    this.blobDirPath = blobDirPath;

    if (!fs.existsSync(this.blobDirPath)) {
      fs.mkdirSync(this.blobDirPath);
    }
  }

  protected async _healthCheck(): Promise<void> {
    return Promise.resolve();
  }

  protected async _getBlob(versionedHash: string): Promise<string> {
    const blobFilePath = this.buildBlobFileName(versionedHash);

    try {
      const blobData = await fs.promises.readFile(blobFilePath, "utf-8");

      return blobData;
    } catch (error) {
      throw new Error(`Blob file ${versionedHash} missing: ${error}`);
    }
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const blobFilePath = this.buildBlobFileName(uri);

    await fs.promises.unlink(blobFilePath);
  }

  protected async _storeBlob(
    versionedHash: string,
    data: string
  ): Promise<string> {
    const blobfilePath = this.buildBlobFileName(versionedHash);
    const blobDirPath = blobfilePath.slice(0, blobfilePath.lastIndexOf("/"));

    if (!fs.existsSync(blobDirPath)) {
      fs.mkdirSync(blobDirPath, { recursive: true });
    }

    await fs.promises.writeFile(blobfilePath, data, { encoding: "utf-8" });

    return blobfilePath;
  }

  protected buildBlobFileName(versionedHash: string) {
    const blobFileName = super.buildBlobFileName(versionedHash);

    return path.join(this.blobDirPath, blobFileName);
  }

  static getConfigFromEnv(env: Partial<Environment>): FileSystemStorageConfig {
    const baseConfig = super.getConfigFromEnv(env);

    if (!env.FILE_SYSTEM_STORAGE_PATH) {
      throw new BlobStorageError(
        this.name,
        "No path provided. You must define variable FILE_SYSTEM_STORAGE_PATH in order to use the Filesystem storage"
      );
    }

    return {
      ...baseConfig,
      blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
    };
  }
}
