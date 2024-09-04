import { Bee } from "@ethersphere/bee-js";

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
    await this._beeClient.checkConnection();
  }

  protected async _getBlob(uri: string) {
    const file = await this._beeClient.downloadFile(uri);

    return file.data.text();
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this._beeClient.unpin(uri);
  }

  protected async _storeBlob(versionedHash: string, data: string) {
    const response = await this._beeClient.uploadFile(
      this.batchId,
      data,
      this.getBlobFilePath(versionedHash),
      {
        contentType: "text/plain",
        deferred: env.SWARM_DEFERRED_UPLOAD,
      }
    );

    return response.reference.toString();
  }

  getBlobUri(_: string) {
    return undefined;
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
