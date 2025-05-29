import axios from "axios";

import type { BlobscanPrismaClient } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import { BaseSwarmStorage } from "./BaseSwarmStorage";
import type { BaseSwarmStorageConfig } from "./BaseSwarmStorage";

export interface ChunkstormStorageConfig extends BaseSwarmStorageConfig {
  apiBaseUrl: string;
  batchId?: string;
}

export class ChunkstormStorage extends BaseSwarmStorage {
  private apiBaseUrl: string;

  constructor({
    apiBaseUrl,
    beeEndpoint,
    chainId,
    batchId,
  }: ChunkstormStorageConfig) {
    super(BlobStorageName.CHUNKSTORM, { beeEndpoint, chainId, batchId });
    this.apiBaseUrl = apiBaseUrl;
  }

  protected async _healthCheck(): Promise<void> {
    try {
      await axios.get(`${this.apiBaseUrl}/health`);
    } catch (error) {
      throw new Error(`Chunkstorm server is not reachable: ${error}`);
    }
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

  static async create({
    prisma,
    ...config
  }: Omit<ChunkstormStorageConfig, "batchId"> & {
    prisma: BlobscanPrismaClient;
  }) {
    return BaseSwarmStorage.safeCreate(
      ChunkstormStorage,
      prisma,
      config,
      this.name
    );
  }
}
