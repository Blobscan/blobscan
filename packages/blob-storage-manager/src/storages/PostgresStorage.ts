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
      .then(({ data }) => `0x${data.toString("hex")}`);
  }

  storeBlob(
    _: number,
    versionedHash: string,
    blobData: string
  ): Promise<string> {
    const data = Buffer.from(blobData.slice(2), "hex");
    const id = versionedHash;

    return this.client.blobData
      .upsert({
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
