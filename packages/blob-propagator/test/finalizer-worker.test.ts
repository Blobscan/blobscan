import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import "@blobscan/test";
import type { BlobStorage } from "@blobscan/blob-storage-manager";
import { env } from "@blobscan/env";
import { fixtures } from "@blobscan/test";

import type {
  BlobPropagationInput,
  BlobPropagationFinalizerJob,
} from "../src/types";
import { finalizerProcessor } from "../src/worker-processors";
import { createStorageFromEnv } from "./helpers";

describe("Finalizer Worker", () => {
  let stagingBlobStorage: BlobStorage;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const blob = fixtures.blobs[0]!;
  const blobInput: BlobPropagationInput = {
    versionedHash: blob.versionedHash,
    data: "0x1234abcdeff123456789ab34223a4b2c2ed0",
    blockNumber: blob.firstBlockNumber ?? 1001,
  };

  beforeAll(async () => {
    stagingBlobStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );
  });

  beforeEach(async () => {
    await stagingBlobStorage.storeBlob(blobInput.versionedHash, blobInput.data);
  });

  it("should remove blob data from temporary blob storage", async () => {
    const blobUri =
      stagingBlobStorage.getBlobUri(blobInput.versionedHash) ?? "";
    const beforeStoredBlob = await stagingBlobStorage.getBlob(blobUri);

    expect(
      beforeStoredBlob,
      "Stored blob data should exist before finalizer"
    ).toBeDefined();

    await finalizerProcessor({
      stagingBlobStorage,
    })({
      data: {
        stagingBlobUri: blobUri,
      },
    } as BlobPropagationFinalizerJob);

    await expect(stagingBlobStorage.getBlob(blobUri)).rejects.toThrowError();
  });
});
