import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import "@blobscan/test";
import {
  createStorageFromEnv,
  getBlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type {
  BlobStorage,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import { fixtures } from "@blobscan/test";

import { env } from "../src/env";
import type { Blob, BlobPropagationFinalizerJob } from "../src/types";
import { finalizerProcessor } from "../src/worker-processors";

describe("Finalizer Worker", () => {
  let blobStorageManager: BlobStorageManager;
  let temporalBlobStorage: BlobStorage;

  const blob: Blob = {
    versionedHash: fixtures.blobs[0]?.versionedHash ?? "",
    data: "0x1234abcdeff123456789ab34223a4b2c2ed",
  };

  beforeAll(async () => {
    blobStorageManager = await getBlobStorageManager();

    const [tmpBlobStorage, tmpBlobStorageError] = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    if (!tmpBlobStorage || tmpBlobStorageError) {
      throw new Error(
        `Error creating temporal blob storage: ${tmpBlobStorageError}`
      );
    }

    blobStorageManager.addStorage(tmpBlobStorage);

    temporalBlobStorage = tmpBlobStorage;
  });

  beforeEach(async () => {
    await temporalBlobStorage.storeBlob(blob.versionedHash, blob.data);
  });

  it("should remove blob data from temporary blob storage", async () => {
    const blobUri = temporalBlobStorage.getBlobUri(blob.versionedHash) ?? "";
    const beforeStoredBlob = await temporalBlobStorage.getBlob(blobUri);

    expect(
      beforeStoredBlob,
      "Stored blob data should exist before finalizer"
    ).toBeDefined();

    await finalizerProcessor({
      temporaryBlobStorage: temporalBlobStorage,
    })({
      data: {
        temporaryBlobUri: blobUri,
      },
    } as BlobPropagationFinalizerJob);

    await expect(temporalBlobStorage.getBlob(blobUri)).rejects.toThrowError();
  });
});
