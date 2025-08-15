import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import "@blobscan/test";
import type {
  BlobStorage,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { env } from "@blobscan/env";
import { fixtures } from "@blobscan/test";

import type {
  BlobPropagationInput,
  BlobPropagationFinalizerJob,
} from "../src/types";
import { finalizerProcessor } from "../src/worker-processors";
import { createBlobStorageManager, createStorageFromEnv } from "./helpers";

describe("Finalizer Worker", () => {
  let blobStorageManager: BlobStorageManager;
  let temporalBlobStorage: BlobStorage;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const blob = fixtures.blobs[0]!;
  const blobInput: BlobPropagationInput = {
    versionedHash: blob.versionedHash,
    data: "0x1234abcdeff123456789ab34223a4b2c2ed0",
    blockNumber: blob.firstBlockNumber ?? 1001,
  };

  beforeAll(async () => {
    blobStorageManager = await createBlobStorageManager();

    const tmpBlobStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    blobStorageManager.addStorage(tmpBlobStorage);

    temporalBlobStorage = tmpBlobStorage;
  });

  beforeEach(async () => {
    await temporalBlobStorage.storeBlob(
      blobInput.versionedHash,
      blobInput.data
    );
  });

  it("should remove blob data from temporary blob storage", async () => {
    const blobUri =
      temporalBlobStorage.getBlobUri(blobInput.versionedHash) ?? "";
    const beforeStoredBlob = await temporalBlobStorage.getBlob(blobUri);

    expect(
      beforeStoredBlob,
      "Stored blob data should exist before finalizer"
    ).toBeDefined();

    await finalizerProcessor({
      temporaryBlobStorage: temporalBlobStorage,
    })({
      data: {
        stagingBlobUri: blobUri,
      },
    } as BlobPropagationFinalizerJob);

    await expect(temporalBlobStorage.getBlob(blobUri)).rejects.toThrowError();
  });
});
