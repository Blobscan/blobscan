import type { PrismaClient } from "@blobscan/db";
import prisma from "@blobscan/db/prisma/__mocks__/client";

import { BLOB_HASH, RAW_DATA } from "../../test/fixtures";
import { PostgresStorage } from "../storages";

export class PostgresStorageMock extends PostgresStorage {
  constructor() {
    super();

    this.client = prisma as unknown as PrismaClient;
  }

  getBlob(versionedHash: string): Promise<string> {
    // mock prisma query
    prisma.blobData.findFirstOrThrow.mockResolvedValue({
      id: BLOB_HASH,
      data: RAW_DATA,
    });

    return super.getBlob(versionedHash);
  }

  async storeBlob(
    _: number,
    versionedHash: string,
    blobData: string
  ): Promise<string> {
    // mock prisma query
    prisma.blobData.upsert.mockResolvedValue({
      id: BLOB_HASH,
      data: RAW_DATA,
    });

    return super.storeBlob(_, versionedHash, blobData);
  }
}
