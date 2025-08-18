import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { BlobStorage, SwarmStorage } from "@blobscan/blob-storage-manager";
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
import { createBlobStorages, createStorageFromEnv } from "./helpers";

function runWorkerTests(
  storageName: BlobStorageName,
  getWorkerParams: () => Promise<BlobPropagationWorkerParams>,
  blob: { versionedHash: string; data: string; blobUri: string }
) {
  describe(`when running the ${storageName} worker`, () => {
    let storageWorkerProcessor: ReturnType<BlobPropagationWorkerProcessor>;
    let targetBlobStorage: BlobStorage;
    let prisma: BlobscanPrismaClient;
    let job: BlobPropagationJob;
    const dbBlob: DBBlob = {
      versionedHash: blob.versionedHash,
      commitment: "test-commitment",
      proof: "test-proof",
      insertedAt: new Date(),
      size: 1,
      usageSize: 1,
      updatedAt: new Date(),
      firstBlockNumber: null,
    };

    beforeEach(async () => {
      const workerParams = await getWorkerParams();

      const storageWorker = STORAGE_WORKER_PROCESSORS[storageName];

      if (!storageWorker) {
        throw new Error(
          `No worker processor found for the "${storageName}" storage`
        );
      }

      storageWorkerProcessor = storageWorker(workerParams);

      targetBlobStorage = workerParams.targetBlobStorage;

      const blobUri = await workerParams.incomingBlobStorage.storeIncomingBlob(
        blob.versionedHash,
        blob.data
      );

      job = {
        data: {
          incomingBlobUri: blobUri,
          versionedHash: blob.versionedHash,
        },
      } as BlobPropagationJob;

      prisma = workerParams.prisma;

      await prisma.blob.create({
        data: dbBlob,
      });

      return async () => {
        await workerParams.incomingBlobStorage.removeBlob(blobUri);

        await prisma.blobDataStorageReference.deleteMany({
          where: {
            blobHash: blob.versionedHash,
          },
        });

        await prisma.blob.delete({
          where: {
            versionedHash: dbBlob.versionedHash,
          },
        });
      };
    });

    it(`propagate the blob to the ${storageName} storage correctly`, async () => {
      await storageWorkerProcessor(job);

      const result = await targetBlobStorage.getBlob(blob.blobUri);

      expect(result).toEqual(blob.data);
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
      "should throw an error if the blob wasn't found in the incoming blob storage",
      async () => {
        const versionedHash = "missingBlobDataFileVersionedHash";
        const jobWithMissingBlobData = {
          data: {
            incomingBlobUri: "missingBlobDataFileVersionedHash",
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
describe("Storage Worker", () => {
  let incomingBlobStorage: BlobStorage;
  const blobVersionedHash = "test-blob-versioned-hash";
  const blobData = "0x1234abcdeff123456789ab34223a4b2c2e";
  let blobStorages: BlobStorage[];

  const mockedSwarmBlobUri = "0xswarm-reference";

  beforeAll(async () => {
    blobStorages = await createBlobStorages();
    incomingBlobStorage = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    blobStorages.push(incomingBlobStorage);
  });

  afterAll(() => {
    vi.clearAllMocks();
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
    {
      storage: "S3",
      uri: "1/st/-b/lo/st-blob-versioned-hash.bin",
    },
  ];

  storages.forEach(({ storage: storageName, uri }) => {
    runWorkerTests(
      storageName,
      () => {
        const targetBlobStorage = blobStorages.find(
          (storage) => storage.name === storageName
        );

        if (!targetBlobStorage) {
          throw new Error(`Blob storage ${storageName} not found`);
        }

        return Promise.resolve({
          targetBlobStorage,
          incomingBlobStorage,
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
      return Promise.resolve({
        targetBlobStorage: {
          name: "SWARM",
          getBlob: async (uri) => {
            if (uri === mockedSwarmBlobUri) {
              return Promise.resolve(blobData);
            }

            return Promise.reject(new Error("Blob not found"));
          },
          storeBlob: async (_, __) => {
            return mockedSwarmBlobUri;
          },
        } as SwarmStorage,
        incomingBlobStorage,
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
