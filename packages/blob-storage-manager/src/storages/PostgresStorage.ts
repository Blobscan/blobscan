import { PrismaClient } from "@blobscan/db";

import type { BlobStorageConfig } from "../BlobStorage";
import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";

export class PostgresStorage extends BlobStorage {
  client: PrismaClient;

  constructor() {
    super();

    this.client = new PrismaClient();
  }

  healthCheck(): Promise<void> {
    return Promise.resolve();
  }

  getBlob(versionedHash: string): Promise<string> {
    return this.client.blobData
      .findFirstOrThrow({
        select: {
          data: true,
        },
        where: {
          id: versionedHash,
        },
      })
      .then(({ data }) => data.toString("hex"));
  }

  storeBlob(
    chainId: number,
    versionedHash: string,
    blobData: string
  ): Promise<string> {
    return this.client.blobData
      .create({
        data: {
          data: Buffer.from(blobData, "hex"),
          id: versionedHash,
        },
      })
      .then(() => versionedHash);
  }

  static tryGetConfigFromEnv(env: Environment): BlobStorageConfig | undefined {
    if (!env.POSTGRES_STORAGE_ENABLED) {
      return;
    }

    return {};
  }
}
