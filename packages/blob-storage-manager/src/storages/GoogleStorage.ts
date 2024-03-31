import type { StorageOptions } from "@google-cloud/storage";
import { Storage } from "@google-cloud/storage";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";
import { BLOB_STORAGE_NAMES } from "../utils";

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

  constructor({
    chainId,
    bucketName,
    projectId,
    serviceKey,
    apiEndpoint,
  }: GoogleStorageConfig) {
    super(BLOB_STORAGE_NAMES.GOOGLE, chainId);

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
    return (
      await this._storageClient.bucket(this._bucketName).file(uri).download()
    ).toString();
  }

  protected async _storeBlob(
    versionedHash: string,
    data: string
  ): Promise<string> {
    const fileName = this.buildBlobFileName(versionedHash);

    await this._storageClient
      .bucket(this._bucketName)
      .file(fileName)
      .save(data);

    return fileName;
  }

  async setUpBucket() {
    if (this._storageClient.bucket(this._bucketName)) {
      return;
    }

    return this._storageClient.createBucket(this._bucketName);
  }

  static getConfigFromEnv(env: Partial<Environment>): GoogleStorageConfig {
    const baseConfig = super.getConfigFromEnv(env);

    if (
      !env.GOOGLE_STORAGE_BUCKET_NAME ||
      (!env.GOOGLE_SERVICE_KEY && !env.GOOGLE_STORAGE_API_ENDPOINT)
    ) {
      throw new Error(
        "No config variables found: no bucket name, api endpoint or service key provided"
      );
    }

    return {
      ...baseConfig,
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
      serviceKey: env.GOOGLE_SERVICE_KEY,
      apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
    };
  }
}
