import { PrismaClient } from "@blobscan/db";

import { BlobStorage } from "../BlobStorage";
import type { Environment } from "../env";

export class PrismaStorage extends BlobStorage {
  client: PrismaClient;

  constructor() {
    super();

    this.client = new PrismaClient();
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

  static tryFromEnv(env: Environment): PrismaStorage | null {
    return new PrismaStorage();
  }
}
