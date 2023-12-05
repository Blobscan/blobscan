import { beforeEach, describe, expect, it } from "vitest";

import "@blobscan/test";
import type { Job } from "bullmq";

import { fixtures } from "@blobscan/test";

import { blobFileManager } from "../src/blob-file-manager";
import type { Blob, BlobPropagationJobData } from "../src/types";
import finalizer from "../src/worker-processors/finalizer";

describe("Finalizer Worker", () => {
  const blob: Blob = {
    versionedHash: fixtures.blobs[0]?.versionedHash ?? "",
    data: "0x1234abcdeff123456789ab34223a4b2c2ed",
  };
  const job = {
    data: {
      versionedHash: blob.versionedHash,
    },
  } as Job<BlobPropagationJobData>;

  beforeEach(async () => {
    await blobFileManager.createBlobDataFile(blob);
  });

  it("should remove blob data files from disk correctly", async () => {
    await finalizer(job);

    await expect(
      blobFileManager.checkBlobDataFileExists(blob.versionedHash)
    ).resolves.toBe(false);
  });
});
