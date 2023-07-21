import type { BlobscanPrismaClient } from "@blobscan/db";

import { BlobStorage } from "../BlobStorage";

export class PrismaStorage extends BlobStorage {
  #prismaClient: BlobscanPrismaClient;

  constructor(prismaClient: BlobscanPrismaClient) {
    super();

    this.#prismaClient = prismaClient;
  }

  getBlob(versionedHash: string): Promise<string> {
    return this.#prismaClient.blobData
      .findFirstOrThrow({
        select: {
          data: true,
        },
        where: {
          blobHash: versionedHash,
        },
      })
      .then(({ data }) => data.toString("hex"));
  }

  storeBlob(
    chainId: number,
    versionedHash: string,
    blobData: string
  ): Promise<string> {
    return this.#prismaClient.blobData
      .create({
        data: {
          data: Buffer.from(blobData, "hex"),
          blobHash: versionedHash,
        },
      })
      .then(() => versionedHash);
  }
}
