import type { BlobscanPrismaClient } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";

import { BaseSwarmStorage } from "./BaseSwarmStorage";
import type { BaseSwarmStorageConfig } from "./BaseSwarmStorage";

export interface SwarmStorageConfig extends BaseSwarmStorageConfig {
  batchId: string;
}

export class SwarmStorage extends BaseSwarmStorage {
  constructor({ batchId, beeEndpoint, chainId }: SwarmStorageConfig) {
    super(BlobStorageName.SWARM, { beeEndpoint, chainId, batchId });
  }

  protected async _storeBlob(versionedHash: string, data: string) {
    if (!this.batchId) {
      throw new Error("Batch ID is required for storing blobs in Swarm");
    }

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
    return BaseSwarmStorage.safeCreate(SwarmStorage, prisma, config, this.name);
  }
}
