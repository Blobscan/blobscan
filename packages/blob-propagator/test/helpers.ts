import { afterEach, beforeEach, expect, it } from "vitest";
import type { SuiteFactory } from "vitest";

import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobReference } from "@blobscan/blob-storage-manager";
import type { BlobStorage, BlobStorage as BlobStorageName } from "@blobscan/db";

import type { BlobPropagationSandboxedJob } from "../src/types";
import { createBlobDataFile, removeBlobDataFile } from "../src/utils";
import gcsStorage from "../src/worker-processors/gcs";
import postgresWorker from "../src/worker-processors/postgres";
import swarmWorker from "../src/worker-processors/swarm";

type TestSuiteFixtures = {
  blobVersionedHash: string;
  blobStorageReference: string;
  blobData: string;
};

type TestSuiteOptions = {
  fixtures: TestSuiteFixtures;
  runBeforeAllFns?: () => void;
  runAfterAllFns?: () => void;
};

function getStorageWorker(storage: BlobStorage) {
  switch (storage) {
    case "GOOGLE":
      return gcsStorage;
    case "POSTGRES":
      return postgresWorker;
    case "SWARM":
      return swarmWorker;
  }
}

export function runStorageWorkerTestSuite(
  storage: BlobStorageName,
  {
    fixtures: { blobVersionedHash, blobStorageReference, blobData },
    runBeforeAllFns,
    runAfterAllFns,
  }: TestSuiteOptions
): SuiteFactory {
  return () => {
    const expectedBlobStorageRef: BlobReference = {
      storage,
      reference: blobStorageReference,
    };
    const storageWorker = getStorageWorker(storage);
    const job = {
      data: {
        versionedHash: blobVersionedHash,
      },
    } as BlobPropagationSandboxedJob;

    if (runBeforeAllFns) {
      runBeforeAllFns();
    }

    if (runAfterAllFns) {
      runAfterAllFns();
    }

    beforeEach(async () => {
      await createBlobDataFile({
        versionedHash: blobVersionedHash,
        data: blobData,
      });
    });

    afterEach(async () => {
      await removeBlobDataFile(blobVersionedHash);
    });

    it(`should store blob data in the ${storage} storage correctly`, async () => {
      await storageWorker(job);

      const expectedResult = { storage, data: blobData };
      const result = await (
        await getBlobStorageManager()
      ).getBlob(expectedBlobStorageRef);

      expect(result).toEqual(expectedResult);
    });

    it(`should return the correct blob ${storage} storage reference`, async () => {
      const blobStorageReference = await storageWorker(job);

      expect(blobStorageReference).toEqual(expectedBlobStorageRef);
    });

    it("should throw an error if the blob data file is missing", async () => {
      const versionedHash = "missingBlobDataFileVersionedHash";
      const jobWithMissingBlobData = {
        data: {
          versionedHash,
        },
      } as BlobPropagationSandboxedJob;

      await expect(
        storageWorker(jobWithMissingBlobData)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Couldn\'t read blob missingBlobDataFileVersionedHash data file: file is missing"'
      );
      ``;
    });
  };
}
