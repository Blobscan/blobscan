import type { StorageOptions } from "@google-cloud/storage";
import { Storage } from "@google-cloud/storage";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";

export interface GoogleStorageConfig extends BlobStorageConfig {
  serviceKey?: string;
  projectId?: string;
  bucketName: string;
  apiEndpoint?: string;
}

export type GoogleCredentials = {
  client_email: string;
  private_key: string;
};

export class GoogleStorage extends BlobStorage {
  _storageClient: Storage;
  _bucketName: string;

  protected constructor({
    chainId,
    bucketName,
    projectId,
    serviceKey,
    apiEndpoint,
  }: GoogleStorageConfig) {
    super(BlobStorageName.GOOGLE, chainId);

    try {
      const storageOptions: StorageOptions = {};

      if (serviceKey) {
        storageOptions.credentials = JSON.parse(
          Buffer.from(serviceKey, "base64").toString()
        ) as GoogleCredentials;
      }

      if (apiEndpoint) {
        storageOptions.apiEndpoint = apiEndpoint;
      }

      storageOptions.projectId = projectId;

      this._storageClient = new Storage(storageOptions);

      this._bucketName = bucketName;
    } catch (err) {
      throw new Error("Failed to create google storage client", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    const [buckets] = await this._storageClient.getBuckets();

    if (!buckets.find((b) => b.name === this._bucketName)) {
      throw new Error(`Bucket ${this._bucketName} does not exist`);
    }
  }

  protected async _getBlob(uri: string) {
    const blobFile = await this.getBlobFile(uri).download();

    return blobFile.toString();
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const blobFile = this.getBlobFile(uri);
    const [blobExists] = await blobFile.exists();

    if (blobExists) {
      await blobFile.delete();
    }
  }

  protected async _storeBlob(
    versionedHash: string,
    data: Buffer
  ): Promise<string> {
    const blobUri = this.getBlobUri(versionedHash);
    await this._storageClient.bucket(this._bucketName).file(blobUri).save(data);
    return blobUri;
  }

  getBlobUri(hash: string) {
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
  }

  protected getBlobFile(uri: string) {
    return this._storageClient.bucket(this._bucketName).file(uri);
  }

  static async create(config: GoogleStorageConfig) {
    try {
      const storage = new GoogleStorage(config);

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
