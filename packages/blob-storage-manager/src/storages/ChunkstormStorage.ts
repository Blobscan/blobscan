import { Bee } from "@ethersphere/bee-js";
import axios from "axios";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";

export interface ChunkstormStorageConfig extends BlobStorageConfig {
  beeEndpoint: string;
  apiBaseUrl: string;
}
export class ChunkstormStorage extends BlobStorage {
  _beeClient: Bee;
  apiBaseUrl: string;

  protected constructor({
    beeEndpoint,
    chainId,
    apiBaseUrl,
  }: ChunkstormStorageConfig) {
    super(BlobStorageName.CHUNKSTORM, chainId);

    this.apiBaseUrl = apiBaseUrl;
    try {
      this._beeClient = new Bee(beeEndpoint);
    } catch (err) {
      throw new Error("Failed to create Bee client", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    await this._beeClient.checkConnection();
  }

  protected async _getBlob(uri: string) {
    const file = await this._beeClient.downloadFile(uri);

    return file.data.toHex();
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this._beeClient.unpin(uri);
  }

  // TODO: Investigate how to use versionedHash for upload chunk functions
  protected async _storeBlob(
    versionedHash: string,
    data: string
  ): Promise<string> {
    const buffer = Buffer.from(data);

    const response = await axios.post(`${this.apiBaseUrl}/data`, buffer, {
      headers: {
        Accept: "application/json",

        "Content-Type": "application/octet-stream",
      },

      responseType: "json",
    });

    return response.data.reference;
  }

  getBlobUri(_: string) {
    return undefined;
  }

  static async create({ ...config }: ChunkstormStorageConfig) {
    try {
      const storage = new ChunkstormStorage({ ...config });

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
