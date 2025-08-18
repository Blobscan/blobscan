import type { BlobscanPrismaClient } from "@blobscan/db";
import { PrismaClient } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import { StorageCreationError } from "../errors";
import { bytesToHex } from "../utils";

export interface PostgresStorageConfig extends BlobStorageConfig {
  prisma?: PrismaClient | BlobscanPrismaClient;
}

export class PostgresStorage extends BlobStorage {
  protected client: PrismaClient | BlobscanPrismaClient;

  protected constructor({ chainId, prisma }: PostgresStorageConfig) {
    super(BlobStorageName.POSTGRES, chainId);

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
      .then(({ data }) => bytesToHex(data));
  }

  protected async _removeBlob(versionedHash: string): Promise<void> {
    const blobExists = !!(await this.client.blobData.findUnique({
      select: {
        id: true,
      },
      where: {
        id: versionedHash,
      },
    }));

    if (blobExists) {
      await this.client.blobData.delete({
        where: {
          id: versionedHash,
        },
      });
    }
  }

  protected async _storeBlob(hash: string, data: Buffer) {
    const uri = this.getBlobUri(hash);

    await this.client.blobData.upsert({
      create: {
        data,
        id: uri,
      },
      update: {
        data,
      },
      where: {
        id: uri,
      },
    });

    return uri;
  }

  protected _storeIncomingBlob(): Promise<string> {
    throw new Error('"storeIncomingBlob" operation is not allowed');
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
