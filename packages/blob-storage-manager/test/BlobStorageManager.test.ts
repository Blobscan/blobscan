import { beforeAll, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { mockDeep } from "vitest-mock-extended";

import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { BlobStorageManager } from "../src/BlobStorageManager";
import { BlobStorageError, BlobStorageManagerError } from "../src/errors";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "../src/storages";
import { NEW_BLOB_DATA, NEW_BLOB_HASH } from "./fixtures";

if (!env.BEE_ENDPOINT) {
  throw new Error("BEE_ENDPOINT test env var is not set");
}

const BEE_ENDPOINT = env.BEE_ENDPOINT;

describe("BlobStorageManager", () => {
  let blobStorageManager: BlobStorageManager;
  let postgresStorage: PostgresStorage;
  let googleStorage: GoogleStorage;
  let swarmStorage: SwarmStorage;

  let failingPostgresStorage: DeepMockProxy<PostgresStorage>;
  let failingGoogleStorage: DeepMockProxy<GoogleStorage>;
  let failingSwarmStorage: DeepMockProxy<SwarmStorage>;

  const expectedStoredBlobHash = "blobHash004";
  const expectedStoredBlobData = "0x4fe40fc67f9c3a3ffa2be77d10fe7818";
  const expectedPostgresStoredBlobUri = expectedStoredBlobHash;
  const expectedGoogleStoredBlobUri = `${
    env.CHAIN_ID
  }/${expectedStoredBlobHash.slice(2, 4)}/${expectedStoredBlobHash.slice(
    4,
    6
  )}/${expectedStoredBlobHash.slice(6, 8)}/${expectedStoredBlobHash.slice(
    2
  )}.txt`;

  beforeAll(async () => {
    if (!env.GOOGLE_STORAGE_BUCKET_NAME) {
      throw new BlobStorageError(
        "GoogleStorage",
        "GOOGLE_STORAGE_BUCKET_NAME is not set"
      );
    }

    postgresStorage = await PostgresStorage.create({ chainId: env.CHAIN_ID });
    googleStorage = await GoogleStorage.create({
      chainId: env.CHAIN_ID,
      bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
      apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
      projectId: env.GOOGLE_STORAGE_PROJECT_ID,
    });
    swarmStorage = await SwarmStorage.create({
      chainId: env.CHAIN_ID,
      beeEndpoint: BEE_ENDPOINT,
      beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
      prisma,
    });

    blobStorageManager = new BlobStorageManager([
      postgresStorage,
      googleStorage,
      swarmStorage,
    ]);

    failingPostgresStorage = mockDeep<PostgresStorage>();
    failingGoogleStorage = mockDeep<GoogleStorage>();
    failingSwarmStorage = mockDeep<SwarmStorage>();

    failingPostgresStorage.storeBlob.mockRejectedValue(
      new BlobStorageError(
        "PostgresStorage",
        "Failed to upload blob to postgres"
      )
    );
    failingGoogleStorage.storeBlob.mockRejectedValue(
      new BlobStorageError("GoogleStorage", "Failed to upload blob to google")
    );
    failingSwarmStorage.storeBlob.mockRejectedValue(
      new BlobStorageError("SwarmStorage", "Failed to upload blob to swarm")
    );
  });

  describe("when creating a new instance", () => {
    it("should throw an error if no blob storages are provided", () => {
      expect(() => new BlobStorageManager([])).toThrow(
        "No blob storages provided"
      );
    });
  });

  it("should return the correct blob storage for a given name", async () => {
    expect(blobStorageManager.getStorage("POSTGRES")).toEqual(postgresStorage);

    expect(blobStorageManager.getStorage("GOOGLE")).toEqual(googleStorage);
    expect(blobStorageManager.getStorage("SWARM")).toEqual(swarmStorage);
  });

  describe("when checking if a blob storage exists", () => {
    it("should return true if it does", () => {
      expect(blobStorageManager.hasStorage("GOOGLE")).toBeTruthy();
    });

    it("should return false if it does not", () => {
      expect(blobStorageManager.hasStorage("FILE_SYSTEM")).toBeFalsy();
    });
  });

  it("should add a new blob storage correctly", () => {
    const bsm = new BlobStorageManager([postgresStorage]);

    bsm.addStorage(googleStorage);

    expect(bsm.getStorage("GOOGLE")).toEqual(googleStorage);
  });

  it("should remove a blob storage correctly", () => {
    const bsm = new BlobStorageManager([postgresStorage, googleStorage]);

    bsm.removeStorage("GOOGLE");

    expect(bsm.hasStorage("GOOGLE")).toBeFalsy();
  });

  describe("when getting a blob", async () => {
    describe("when getting a blob by its references", () => {
      it("should return the blob data", async () => {
        const result = await blobStorageManager.getBlobByReferences(
          {
            reference: expectedPostgresStoredBlobUri,
            storage: "POSTGRES",
          },
          {
            reference: expectedGoogleStoredBlobUri,
            storage: "GOOGLE",
          }
        );

        expect([
          { data: expectedStoredBlobData, storage: "POSTGRES" },
          { data: expectedStoredBlobData, storage: "GOOGLE" },
        ]).toContainEqual(result);
      });

      testValidError(
        "should throw an error if no storage is supported for the provided references",
        async () => {
          await blobStorageManager.getBlobByReferences({
            reference: "0x6d6f60xa123bc3245cde6b2d64617461",
            storage: "FILE_SYSTEM",
          });
        },
        BlobStorageManagerError
      );

      testValidError(
        "should throw an error if the data for the provided blob uri is not found",
        async () => {
          const UNKNOWN_BLOB_HASH = "0x6d6f60xa123bc3245cde6b2d64617461";
          const UNKNOWN_FILE_URI = "1/6d/6f/636b2d64617461.txt";
          const UNKNOWN_SWARM_REFERENCE = "123456789abcdef";

          await blobStorageManager.getBlobByReferences(
            {
              reference: UNKNOWN_BLOB_HASH,
              storage: "POSTGRES",
            },
            {
              reference: UNKNOWN_FILE_URI,
              storage: "GOOGLE",
            },
            {
              reference: UNKNOWN_SWARM_REFERENCE,
              storage: "SWARM",
            }
          );
        },
        BlobStorageManagerError,
        {
          checkCause: true,
        }
      );
    });

    describe("when getting a blob by its hash", () => {
      it("should return the blob data", async () => {
        const result = await blobStorageManager.getBlobByHash(
          expectedStoredBlobHash
        );

        expect(result.data).toEqual(expectedStoredBlobData);
      });

      testValidError(
        "should throw an error if the data for the provided blob hash is not found",
        async () => {
          const UNKNOWN_BLOB_HASH = "0xa123bc3245cde";

          await blobStorageManager.getBlobByHash(UNKNOWN_BLOB_HASH);
        },
        BlobStorageManagerError,
        {
          checkCause: true,
        }
      );

      testValidError(
        "should throw an error if no storage is supported that can get the blob by its hash",
        async () => {
          const failingBlobStorageManager = new BlobStorageManager([
            swarmStorage,
          ]);

          await failingBlobStorageManager.getBlobByHash(expectedStoredBlobHash);
        },
        BlobStorageManagerError
      );
    });
  });

  describe("when storing a blob", () => {
    const blob = { data: NEW_BLOB_DATA, versionedHash: NEW_BLOB_HASH };
    it("should store the blob in all available storages", async () => {
      const result = await blobStorageManager.storeBlob(blob);

      expect(result.references).matchSnapshot();
      expect(result.errors).toMatchSnapshot();
    });

    it("should return errors for failed uploads", async () => {
      const newHash = "0x6d6f636b2d64617461";
      const blob = { data: "New data", versionedHash: newHash };

      const blobStorageManager = new BlobStorageManager([
        failingPostgresStorage,
        googleStorage,
        failingSwarmStorage,
      ]);

      const result = await blobStorageManager.storeBlob(blob);

      expect(result).toMatchSnapshot();
    });

    testValidError(
      "should throw an error if all uploads fail",
      async () => {
        const newBlobStorageManager = new BlobStorageManager([
          failingPostgresStorage,
          failingGoogleStorage,
          failingSwarmStorage,
        ]);

        const blob = {
          data: "New data",
          versionedHash: "0x6d6f636b2d64617461",
        };

        await newBlobStorageManager.storeBlob(blob);
      },
      BlobStorageManagerError,
      {
        checkCause: true,
      }
    );
  });
});
