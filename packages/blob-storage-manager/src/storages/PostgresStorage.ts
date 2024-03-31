import { PrismaClient } from "@blobscan/db";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";
import { BLOB_STORAGE_NAMES } from "../utils";

export type PostgresStorageConfig = BlobStorageConfig;

export class PostgresStorage extends BlobStorage {
  protected client: PrismaClient;

  constructor({ chainId }: PostgresStorageConfig) {
    super(BLOB_STORAGE_NAMES.POSTGRES, chainId);

    this.client = new PrismaClient();
  }

  protected _healthCheck(): Promise<void> {
    return Promise.resolve();
  }

  protected _getBlob(versionedHash: string) {
    return this.client.blobData
      .findFirstOrThrow({
        select: {
          data: true,
        },
        where: {
          id: versionedHash,
        },
      })
      .then(({ data }) => `0x${data.toString("hex")}`);
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

  static getConfigFromEnv(env: Partial<Environment>): PostgresStorageConfig {
    const baseConfig = super.getConfigFromEnv(env);

    return {
      ...baseConfig,
    };
  }
}
