import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  BlobStorage,
  BlobStorageManager,
  SwarmStorage,
} from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import type {
  BlobscanPrismaClient,
  Blob as DBBlob,
  BlobStorage as BlobStorageName,
} from "@blobscan/db";
import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { STORAGE_WORKER_PROCESSORS } from "../src/BlobPropagator";
import type {
  BlobPropagationJob,
  BlobPropagationWorkerParams,
  BlobPropagationWorkerProcessor,
} from "../src/types";
import { createBlobStorageManager, createStorageFromEnv } from "./helpers";

function runWorkerTests(
  storageName: BlobStorageName,
  getWorkerParams: () => Promise<BlobPropagationWorkerParams>,
  blob: { versionedHash: string; data: string; blobUri: string }
) {
  const job = {
    data: {
      versionedHash: blob.versionedHash,
    },
  } as BlobPropagationJob;

  describe(`when running the ${storageName} worker`, () => {
    let storageWorkerProcessor: ReturnType<BlobPropagationWorkerProcessor>;
    let blobStorageManager: BlobStorageManager;
    let prisma: BlobscanPrismaClient;

    beforeEach(async () => {
      const workerParams = await getWorkerParams();

      const storageWorker = STORAGE_WORKER_PROCESSORS[storageName];

      if (!storageWorker) {
        throw new Error(
          `No worker processor found for the "${storageName}" storage`
        );
      }

      storageWorkerProcessor = storageWorker(workerParams);

      blobStorageManager = workerParams.blobStorageManager;
      prisma = workerParams.prisma;
    });

    it(`propagate the blob to the ${storageName} storage correctly`, async () => {
      await storageWorkerProcessor(job);

      const expectedResult = { storage: storageName, data: blob.data };
      const result = await blobStorageManager.getBlobByReferences({
        reference: blob.blobUri,
        storage: storageName,
      });

      expect(result).toEqual(expectedResult);
    });

    it(`should store the ${storageName} blob storage reference in the db once propagated correctly`, async () => {
      await storageWorkerProcessor(job);

      const blobStorageReference =
        await prisma.blobDataStorageReference.findUnique({
          where: {
            blobHash_blobStorage: {
              blobHash: blob.versionedHash,
              blobStorage: storageName,
            },
          },
        });

      expect(blobStorageReference?.blobHash, "Blob hash mismatch").toBe(
        blob.versionedHash
      );
      expect(
        blobStorageReference?.dataReference,
        "Data reference mismatch"
      ).toBe(blob.blobUri);
      expect(blobStorageReference?.blobStorage, "Storage name mismatch").toBe(
        storageName
      );
    });

    it(`should return the correct blob ${storageName} storage reference`, async () => {
      const blobStorageReference = await storageWorkerProcessor(job);

      expect(blobStorageReference).toEqual({
        storage: storageName,
        reference: blob.blobUri,
      });
    });

    testValidError(
      "should throw an error if the blob data to be propagated wasn't found in any of the other storages",
      async () => {
        const versionedHash = "missingBlobDataFileVersionedHash";
        const jobWithMissingBlobData = {
          data: {
            versionedHash,
          },
        } as BlobPropagationJob;

        await storageWorkerProcessor(jobWithMissingBlobData);
      },
      Error,
      {
        checkCause: true,
      }
    );
  });
}
describe("Storage Workers", () => {
  let tmpBlobStorage: BlobStorage;
  const blobVersionedHash = "test-blob-versioned-hash";
  const blobData = "0x1234abcdeff123456789ab34223a4b2c2e";
  let bsm: BlobStorageManager;

  const blob: DBBlob = {
    versionedHash: blobVersionedHash,
    commitment: "test-commitment",
    proof: "test-proof",
    insertedAt: new Date(),
    size: 1,
    usageSize: 1,
    updatedAt: new Date(),
    firstBlockNumber: null,
  };

  const mockedSwarmBlobUri = "0xswarm-reference";

  beforeAll(async () => {
    bsm = await createBlobStorageManager();

    const tmpStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    bsm.addStorage(tmpStorage);

    tmpBlobStorage = tmpStorage;
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  beforeEach(async () => {
    await tmpBlobStorage.storeBlob(blobVersionedHash, blobData);
    await prisma.blob.create({
      data: blob,
    });
  });

  afterEach(async () => {
    const blobUri = tmpBlobStorage.getBlobUri(blobVersionedHash);

    if (blobUri) {
      await tmpBlobStorage.removeBlob(blobUri);
    }

    await prisma.blobDataStorageReference.deleteMany({
      where: {
        blobHash: blobVersionedHash,
      },
    });
    await prisma.blob.delete({
      where: {
        versionedHash: blobVersionedHash,
      },
    });
  });

  const storages: { storage: BlobStorageName; uri: string }[] = [
    {
      storage: "POSTGRES",
      uri: blobVersionedHash,
    },
    {
      storage: "GOOGLE",
      uri: "1/st/-b/lo/st-blob-versioned-hash.bin",
    },
    {
      storage: "FILE_SYSTEM",
      uri: "test-blobscan-blobs/1/st/-b/lo/st-blob-versioned-hash.bin",
    },
  ];

  storages.forEach(({ storage, uri }) => {
    runWorkerTests(
      storage,
      () => {
        return Promise.resolve({
          blobStorageManager: bsm,
          temporaryBlobStorage: tmpBlobStorage,
          prisma,
        });
      },
      {
        blobUri: uri,
        data: blobData,
        versionedHash: blobVersionedHash,
      }
    );
  });

  runWorkerTests(
    "SWARM",
    () => {
      vi.spyOn(bsm, "getStorage").mockImplementation((storage) => {
        if (storage === "SWARM") {
          return {
            getBlob: async (uri) => {
              if (uri === mockedSwarmBlobUri) {
                return Promise.resolve(blobData);
              }

              return Promise.reject(new Error("Blob not found"));
            },
            storeBlob: async (_, __) => {
              return mockedSwarmBlobUri;
            },
          } as SwarmStorage;
        }
      });

      return Promise.resolve({
        blobStorageManager: bsm,
        temporaryBlobStorage: tmpBlobStorage,
        prisma,
      });
    },
    {
      versionedHash: blobVersionedHash,
      data: blobData,
      blobUri: mockedSwarmBlobUri,
    }
  );
});
