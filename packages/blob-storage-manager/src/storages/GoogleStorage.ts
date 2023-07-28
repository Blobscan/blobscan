import { Storage } from "@google-cloud/storage";
import type { StorageOptions } from "@google-cloud/storage";

import type { BlobStorageOptions } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";

interface GoogleStorageOptions extends BlobStorageOptions {
  serviceKey?: string;
  projectId?: string;
  bucketName: string;
  apiEndpoint?: string;
}

type GoogleCredentials = {
  client_email: string;
  private_key: string;
};

export class GoogleStorage extends BlobStorage {
  #storageClient: Storage;
  #bucketName: string;

  constructor({
    bucketName,
    projectId,
    serviceKey,
    apiEndpoint,
  }: GoogleStorageOptions) {
    super();

    const storageOptions: StorageOptions = {};

    if (serviceKey) {
      storageOptions.credentials = JSON.parse(
        Buffer.from(serviceKey, "base64").toString()
      ) as GoogleCredentials;
    }

    if (apiEndpoint) {
      storageOptions.apiEndpoint = apiEndpoint;
    }

    this.#bucketName = bucketName;

    storageOptions.projectId = projectId;

    this.#storageClient = new Storage(storageOptions);
  }

  async healthCheck(): Promise<void> {
    const [buckets] = await this.#storageClient.getBuckets();

    if (!buckets.find((b) => b.name === this.#bucketName)) {
      throw new Error(`Bucket ${this.#bucketName} does not exist`);
    }
  }

  async getBlob(uri: string): Promise<string> {
    return (
      await this.#storageClient.bucket(this.#bucketName).file(uri).download()
    ).toString();
  }

  async storeBlob(
    chainId: number,
    versionedHash: string,
    data: string
  ): Promise<string> {
    const fileName = this.buildBlobFileName(chainId, versionedHash);

    await this.#storageClient
      .bucket(this.#bucketName)
      .file(fileName)
      .save(data);

    return fileName;
  }

  async setUpBucket() {
    if (this.#storageClient.bucket(this.#bucketName)) {
      return;
    }

    return this.#storageClient.createBucket(this.#bucketName);
  }

  static tryGetOptsFromEnv(env: Environment): GoogleStorageOptions | undefined {
    if (!env.GOOGLE_STORAGE_ENABLED) {
      return;
    }

    if (
      !env.GOOGLE_STORAGE_BUCKET_NAME ||
      (!env.GOOGLE_SERVICE_KEY && !env.GOOGLE_STORAGE_API_ENDPOINT)
    ) {
      console.warn(
        "Google storage enabled but no bucket name, api endpoint or service key provided."
      );
      return;
    }

    return {
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
      serviceKey: env.GOOGLE_SERVICE_KEY,
      apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
    };
  }
}
