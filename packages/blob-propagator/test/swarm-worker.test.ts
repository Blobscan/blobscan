import { describe, vi } from "vitest";

import type { BlobStorageManager } from "@blobscan/blob-storage-manager";

import { runStorageWorkerTestSuite } from "./helpers";

const fixtures = {
  blobData: "0x1234abcdeff123456789ab34223a4b2c2e",
  blobStorageReference: "swarm-reference",
  blobVersionedHash: "swarmWorkerVersionedHash",
};

describe(
  "Swarm Worker",
  runStorageWorkerTestSuite("SWARM", {
    fixtures,
    runAfterAllFns() {
      vi.clearAllMocks();
    },
  })
);

/**
 * Mock the blob storage manager as we don't have a local swarm node docker
 * container running to test against.
 */
vi.mock("@blobscan/blob-storage-manager", () => {
  return {
    async getBlobStorageManager() {
      return Promise.resolve<Partial<BlobStorageManager>>({
        storeBlob({ versionedHash }) {
          if (versionedHash === fixtures.blobVersionedHash) {
            return Promise.resolve({
              references: [
                {
                  reference: fixtures.blobStorageReference,
                  storage: "SWARM",
                },
              ],
              errors: [],
            });
          }

          return Promise.resolve({
            references: [],
            errors: [],
          });
        },
        getBlob(...blobReferences) {
          const swarmReference = blobReferences.find(
            (ref) => ref.storage === "SWARM"
          );

          if (swarmReference) {
            return Promise.resolve({
              data: fixtures.blobData,
              storage: "SWARM",
            });
          }

          return Promise.resolve({
            data: "",
            storage: "SWARM",
          });
        },
      });
    },
  };
});
