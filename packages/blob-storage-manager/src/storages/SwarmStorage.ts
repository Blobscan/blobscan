import { Bee, BeeResponseError } from "@ethersphere/bee-js";
import axios from "axios";

import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";

export interface SwarmStorageConfig extends BlobStorageConfig {
  batchId: string;
  beeEndpoint: string;
}

export interface SwarmStorageOpts {
  chunkstormEnabled?: boolean;
  chunkstormUrl?: string;
  deferredUpload?: boolean;
}

export class SwarmStorage extends BlobStorage {
  _beeClient: Bee;
  batchId: string;

  _opts: SwarmStorageOpts;

  protected constructor(
    { batchId, beeEndpoint, chainId }: SwarmStorageConfig,
    opts: SwarmStorageOpts = {}
  ) {
    super(BlobStorageName.SWARM, chainId);

    this.batchId = batchId;

    this._opts = {
      deferredUpload: true,
      chunkstormEnabled: false,
      ...opts,
    };

    if (this._opts.chunkstormEnabled && !this._opts.chunkstormUrl) {
      throw new Error("Chunkstorm enabled but no url was provided");
    }

    try {
      this._beeClient = new Bee(beeEndpoint);
    } catch (err) {
      throw new Error("Failed to create swarm clients", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    return this.#performBeeAPICall(async () => {
      await this._beeClient.connectivity.checkConnection();
    });
  }

  protected async _getBlob(uri: string) {
    return this.#performBeeAPICall(async () => {
      const file = await this._beeClient.file.download(uri);

      return file.contentType === "text/plain"
        ? file.data.toUtf8()
        : `0x${file.data.toHex()}`;
    });
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this.#performBeeAPICall(() => this._beeClient.pin.remove(uri));
  }

  protected async _storeBlob(versionedHash: string, data: Buffer) {
    return this.#performBeeAPICall(async () => {
      return this._opts?.chunkstormEnabled
        ? this.#sendToChunkstorm(data)
        : this.#sendToBeeNode(versionedHash, data);
    });
  }

  async #sendToChunkstorm(buffer: Buffer) {
    if (!this._opts?.chunkstormUrl) {
      throw new Error(`Failed to send to chunkstorm: no url defined`);
    }

    const response = await axios.post(
      `${this._opts?.chunkstormUrl}/upload`,
      buffer,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/octet-stream",
        },
        responseType: "json",
      }
    );
    return response.data.reference;
  }

  async #sendToBeeNode(versionedHash: string, buffer: Buffer) {
    const response = await this._beeClient.file.upload(
      this.batchId,
      buffer,
      versionedHash,
      {
        contentType: "application/octet-stream",
        deferred: this._opts?.deferredUpload,
      }
    );
    return response.reference.toHex();
  }

  async #performBeeAPICall<T>(call: () => T) {
    try {
      const res = await call();

      return res;
    } catch (err) {
      if (err instanceof BeeResponseError) {
        throw new Error(
          `Request ${err.method.toUpperCase()} to Bee API ${err.url} batch "${
            this.batchId
          }" at "${this._beeClient.url}" failed with status code ${
            err.status
          } ${err.statusText}: ${err.message}
            - Details: ${JSON.stringify(err.responseBody, null, 2)}
          `,
          err.cause as Error | undefined
        );
      }

      throw err;
    }
  }

  protected getBlobFilePath(hash: string) {
    return `${this.chainId.toString()}/${hash.slice(2, 4)}/${hash.slice(
      4,
      6
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.bin`;
  }

  static async create(config: SwarmStorageConfig) {
    try {
      const storage = new SwarmStorage(config);

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
