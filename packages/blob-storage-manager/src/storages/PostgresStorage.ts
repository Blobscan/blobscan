import { PrismaClient } from "@blobscan/db";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";
import { BLOB_STORAGE_NAMES } from "../utils";

export class PostgresStorage extends BlobStorage {
  protected client: PrismaClient;

  protected constructor() {
    super(BLOB_STORAGE_NAMES.POSTGRES);

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

  protected async _storeBlob(
    _: number,
    versionedHash: string,
    blobData: string
  ) {
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

  static getConfigFromEnv(_: Partial<Environment>): BlobStorageConfig {
    return {};
  }
}
