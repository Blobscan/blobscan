import { describe, vi } from "vitest";

import {
  BlobStorageManager,
  PostgresStorage,
} from "@blobscan/blob-storage-manager";
import { fixtures } from "@blobscan/test";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "Postgres Worker",
  runStorageWorkerTestSuite("POSTGRES", {
    fixtures: {
      blobData: "0x1234abcdeff123456789ab",
      blobStorageReference: "postgresWorkerVersionedHash",
      blobVersionedHash: "postgresWorkerVersionedHash",
    },
    runAfterAllFns() {
      vi.clearAllMocks();
    },
  })
);

vi.mock("@blobscan/blob-storage-manager", async () => {
  const actual = (await vi.importActual(
    "@blobscan/blob-storage-manager"
  )) as Record<string, unknown>;

  return {
    ...actual,
    getBlobStorageManager() {
      return new BlobStorageManager(
        {
          POSTGRES: new PostgresStorage(),
        },
        fixtures.chainId
      );
    },
  };
});
