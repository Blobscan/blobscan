import { Storage } from "@google-cloud/storage";
import type { StorageOptions } from "@google-cloud/storage";

import { BlobStorage } from "../BlobStorage";

type GoogleStorageOptions = {
  serviceKey?: string;
  projectId?: string;
  bucketName: string;
  apiEndpoint?: string;
};

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
}
