import { Bee, BeeResponseError } from "@ethersphere/bee-js";
import axios from "axios";

import type { BlobscanPrismaClient } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";

export interface SwarmStorageConfig extends BlobStorageConfig {
  batchId: string;
  beeEndpoint: string;
}

async function getBatchId(prisma: BlobscanPrismaClient) {
  try {
    const state = await prisma.blobStoragesState.findUnique({
      select: {
        swarmDataId: true,
      },
      where: { id: 1 },
    });

    const batchId = state?.swarmDataId;

    if (!batchId) {
      throw new Error("No batch id found");
    }

    return batchId;
  } catch (err) {
    throw new Error("Failed to get swarm batch id from the database", {
      cause: err,
    });
  }
}

export class SwarmStorage extends BlobStorage {
  _beeClient: Bee;
  batchId: string;

  protected constructor({ batchId, beeEndpoint, chainId }: SwarmStorageConfig) {
    super(BlobStorageName.SWARM, chainId);

    this.batchId = batchId;
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
      await this._beeClient.checkConnection();
    });
  }

  protected async _getBlob(uri: string) {
    return this.#performBeeAPICall(async () => {
      const file = await this._beeClient.downloadFile(uri);

      return file.data.toHex();
    });
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this.#performBeeAPICall(() => this._beeClient.unpin(uri));
  }

  protected async _storeBlob(versionedHash: string, data: string) {
    return this.#performBeeAPICall(async () => {
      return env.SWARM_CHUNKSTORM_ENABLED
        ? this.#sendToChunkstorm(data)
        : this.#sendToBeeNode(versionedHash, data);
    });
  }

  async #sendToChunkstorm(data: string) {
    const buffer = Buffer.from(data);
    const response = await axios.post(
      `${env.SWARM_CHUNKSTORM_URL}/upload`,
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

  async #sendToBeeNode(versionedHash: string, data: string) {
    const response = await this._beeClient.uploadFile(
      this.batchId,
      data,
      versionedHash,
      {
        deferred: env.SWARM_DEFERRED_UPLOAD,
      }
    );
    return response.reference.toHex();
  }

  getBlobUri(_: string) {
    return undefined;
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
    )}/${hash.slice(6, 8)}/${hash.slice(2)}.txt`;
  }

  static async create({
    prisma,
    ...config
  }: Omit<SwarmStorageConfig, "batchId"> & { prisma: BlobscanPrismaClient }) {
    try {
      const batchId = await getBatchId(prisma);
      const storage = new SwarmStorage({ ...config, batchId });

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
