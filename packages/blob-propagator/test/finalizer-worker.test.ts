import { beforeEach, describe, expect, it } from "vitest";

import "@blobscan/test";
import type { Job } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import type { Blob, BlobPropagationJobData } from "../src/types";
import { createBlobDataFile, checkBlobDataFileExists } from "../src/utils";
import finalizer from "../src/worker-processors/finalizer";

describe("Finalizer Worker", () => {
  const blob: Blob = {
    versionedHash: fixtures.blobs[0]?.versionedHash ?? "",
    data: "0x1234abcdeff123456789ab34223a4b2c2ed",
  };
  const blobReference: BlobReference = {
    storage: "GOOGLE",
    reference: "propagatedBlobGoogleReference",
  };
  const job = {
    data: {
      versionedHash: blob.versionedHash,
    },
    getChildrenValues(): Promise<Record<string, BlobReference>> {
      return Promise.resolve({
        storeBlobJob: blobReference,
      });
    },
  } as Job<BlobPropagationJobData>;

  beforeEach(async () => {
    await createBlobDataFile(blob);
  });

  it("should remove blob data files from disk correctly", async () => {
    await finalizer(job);

    await expect(checkBlobDataFileExists(blob.versionedHash)).resolves.toBe(
      false
    );
  });

  it("should store blob data storage references in the database correctly", async () => {
    await finalizer(job);

    const dbBlobReference = await prisma.blobDataStorageReference.findFirst({
      where: {
        blobStorage: blobReference.storage,
        blobHash: blob.versionedHash,
      },
    });

    expect(dbBlobReference?.dataReference).toBe(blobReference.reference);
  });
});
