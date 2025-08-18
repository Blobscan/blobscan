import type { StorageOptions } from "@google-cloud/storage";
import { Storage } from "@google-cloud/storage";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig, GetBlobOpts } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

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

  protected async _getBlob(uri: string, { fileType }: GetBlobOpts) {
    const res = await this._getBlobFile(uri).download();
    const [data] = res;

    return fileType === "text" ? res.toString() : bytesToHex(data);
  }

  protected async _removeBlob(uri: string): Promise<void> {
    const blobFile = this._getBlobFile(uri);
    const [blobExists] = await blobFile.exists();

    if (blobExists) {
      await blobFile.delete();
    }
  }

  protected async _storeBlob(hash: string, data: Buffer): Promise<string> {
    const uri = this.getBlobUri(hash);

    await this._uploadBlob(uri, data);

    return uri;
  }

  protected async _storeIncomingBlob(
    hash: string,
    data: Buffer
  ): Promise<string> {
    const uri = this.getIncomingBlobUri(hash);

    await this._uploadBlob(uri, data);

    return uri;
  }

  protected _getBlobFile(uri: string) {
    return this._storageClient.bucket(this._bucketName).file(uri);
  }

  protected _uploadBlob(uri: string, data: Buffer) {
    return this._storageClient.bucket(this._bucketName).file(uri).save(data, {
      /**
       * Sends the whole file in a single HTTP request. It makes the upload faster and simpler.
       * Recommended for files < 5MB
       */
      //
      resumable: false,
      contentType: "application/octet-stream",
    });
  }

  getBlobUri(hash: string) {
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.bin`;
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
