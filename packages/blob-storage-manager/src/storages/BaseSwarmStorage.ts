import { Bee } from "@ethersphere/bee-js";

import type { BlobscanPrismaClient } from "@blobscan/db";
import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BlobStorage } from "../BlobStorage";
import type { BlobStorageConfig } from "../BlobStorage";
import { StorageCreationError } from "../errors";

export interface BaseSwarmStorageConfig extends BlobStorageConfig {
  beeEndpoint: string;
  batchId?: string;
}

export async function getBatchId(prisma: BlobscanPrismaClient) {
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

export abstract class BaseSwarmStorage extends BlobStorage {
  protected static async createWithBatchId<
    T extends BaseSwarmStorage,
    C extends BaseSwarmStorageConfig
  >(
    StorageClass: new (config: C) => T,
    prisma: BlobscanPrismaClient,
    config: Omit<C, "batchId">
  ): Promise<T> {
    const batchId = await getBatchId(prisma);
    const storage = new StorageClass({ ...config, batchId } as C);
    await storage.healthCheck();
    return storage;
  }

  protected static async safeCreate<
    T extends BaseSwarmStorage,
    C extends BaseSwarmStorageConfig
  >(
    StorageClass: new (config: C) => T,
    prisma: BlobscanPrismaClient,
    config: Omit<C, "batchId">,
    storageName: string
  ): Promise<T> {
    try {
      return await this.createWithBatchId<T, C>(StorageClass, prisma, config);
    } catch (err) {
      const err_ = err as Error;
      throw new StorageCreationError(
        storageName,
        err_.message,
        err_.cause as Error
      );
    }
  }

  protected _beeClient: Bee;
  protected batchId?: string;

  protected constructor(
    storageName: BlobStorageName,
    { beeEndpoint, chainId, batchId }: BaseSwarmStorageConfig
  ) {
    super(storageName, chainId);
    this.batchId = batchId;

    try {
      this._beeClient = new Bee(beeEndpoint);
    } catch (err) {
      throw new Error("Failed to create Bee client", {
        cause: err,
      });
    }
  }

  getBlobUri(_: string): string | undefined {
    return undefined;
  }

  protected async _healthCheck(): Promise<void> {
    await this._beeClient.checkConnection();
  }

  protected async _getBlob(uri: string) {
    const file = await this._beeClient.downloadFile(uri);

    return file.data.text();
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this._beeClient.unpin(uri);
  }

  protected abstract _storeBlob(
    versionedHash: string,
    data: string
  ): Promise<string>;
}
