import { describe, vi } from "vitest";

import {
  BlobStorageManager,
  GoogleStorage,
} from "@blobscan/blob-storage-manager";
import { fixtures } from "@blobscan/test";

import { runStorageWorkerTestSuite } from "./helpers";

describe(
  "GCS Worker",
  runStorageWorkerTestSuite("GOOGLE", {
    runAfterAllFns() {
      vi.clearAllMocks();
    },
    fixtures: {
      blobData: "0x1234abcdeff123456789ab34223a4b2c2e",
      blobStorageReference: "70118930558/og/le/Wo/ogleWorkerVersionedHash.txt",
      blobVersionedHash: "googleWorkerVersionedHash",
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
          GOOGLE: new GoogleStorage(
            fixtures.blobStorageManagerConfig.googleStorageConfig
          ),
        },
        fixtures.chainId
      );
    },
  };
});
