import { Bee, BeeDebug } from "@ethersphere/bee-js";

import type { BlobscanPrismaClient } from "@blobscan/db";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { BLOB_STORAGE_NAMES } from "../utils";

export interface SwarmStorageConfig extends BlobStorageConfig {
  batchId: string;
  beeEndpoint: string;
  beeDebugEndpoint?: string;
}

export type SwarmClient = {
  bee: Bee;
  beeDebug?: BeeDebug;
};

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
  _swarmClient: SwarmClient;
  batchId: string;

  protected constructor({
    batchId,
    beeDebugEndpoint,
    beeEndpoint,
    chainId,
  }: SwarmStorageConfig) {
    super(BLOB_STORAGE_NAMES.SWARM, chainId);

    this.batchId = batchId;
    try {
      this._swarmClient = {
        bee: new Bee(beeEndpoint),
        beeDebug: beeDebugEndpoint ? new BeeDebug(beeDebugEndpoint) : undefined,
      };
    } catch (err) {
      throw new Error("Failed to create swarm clients", {
        cause: err,
      });
    }
  }

  protected async _healthCheck() {
    const healthCheckOps = [];

    healthCheckOps.push(this._swarmClient.bee.checkConnection());

    if (this._swarmClient.beeDebug) {
      healthCheckOps.push(
        this._swarmClient.beeDebug.getHealth().then((health) => {
          if (health.status !== "ok") {
            throw new Error(`Bee debug is not healthy: ${health.status}`);
          }
        })
      );
    }

    await Promise.all(healthCheckOps);
  }

  protected async _getBlob(uri: string) {
    const file = await this._swarmClient.bee.downloadFile(uri);

    return file.data.text();
  }

  protected async _removeBlob(uri: string): Promise<void> {
    await this._swarmClient.bee.unpin(uri);
  }

  protected async _storeBlob(versionedHash: string, data: string) {
    const response = await this._swarmClient.bee.uploadFile(
      this.batchId,
      data,
      this.getBlobFilePath(versionedHash),
      {
        contentType: "text/plain",
        deferred: false,
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
