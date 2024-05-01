import { PrismaClient } from "@blobscan/db";
import type { BlobscanPrismaClient } from "@blobscan/db";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { BLOB_STORAGE_NAMES } from "../utils";

export interface PostgresStorageConfig extends BlobStorageConfig {
  prisma?: PrismaClient | BlobscanPrismaClient;
}

export class PostgresStorage extends BlobStorage {
  protected client: PrismaClient | BlobscanPrismaClient;

  protected constructor({ chainId, prisma }: PostgresStorageConfig) {
    super(BLOB_STORAGE_NAMES.POSTGRES, chainId);

    this.client = prisma ?? new PrismaClient();
  }

  protected _healthCheck(): Promise<void> {
    return Promise.resolve();
  }

  protected _getBlob(uri: string) {
    return this.client.blobData
      .findUniqueOrThrow({
        select: {
          data: true,
        },
        where: {
          id: uri,
        },
      })
      .then(({ data }) => `0x${data.toString("hex")}`);
  }

  protected async _removeBlob(versionedHash: string): Promise<void> {
    await this.client.blobData.delete({
      where: {
        id: versionedHash,
      },
    });
  }

  protected async _storeBlob(versionedHash: string, blobData: string) {
    const data = Buffer.from(blobData.slice(2), "hex");
    const id = versionedHash;

    await this.client.blobData.upsert({
      create: {
        data,
        id,
      },
      update: {
        data,
      },
      where: {
        id,
      },
    });

    return versionedHash;
  }

  getBlobUri(hash: string) {
    return hash;
  }

  static async create(config: PostgresStorageConfig) {
    try {
      const storage = new PostgresStorage(config);

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
