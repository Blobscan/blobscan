import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import blobStorageManager from "@blobscan/blob-storage-manager/src/__mocks__/BlobStorageManager";
import { prisma } from "@blobscan/db";

import type { AppRouter } from "../src/root";
import { INDEXER_DATA } from "./fixtures";
import { getCaller, getIndexedData } from "./helper";

type UpdateSlotInput = inferProcedureInput<AppRouter["indexer"]["updateSlot"]>;
type IndexDataInput = inferProcedureInput<AppRouter["indexer"]["indexData"]>;

vi.mock("../src/env", () => ({
  env: {
    SECRET_KEY: "supersecret",
  },
}));

vi.mock("@blobscan/blob-storage-manager/src/env", () => ({
  env: {
    CHAIN_ID: 7011893058,
    POSTGRES_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_ENABLED: true,
    GOOGLE_STORAGE_PROJECT_ID: "blobscan-test-project",
    GOOGLE_STORAGE_BUCKET_NAME: "blobscan-test-bucket",
    GOOGLE_STORAGE_API_ENDPOINT: "http://localhost:4443",
  },
}));

describe("Indexer route", async () => {
  let caller;
  let callerWithClient;
  let callerWithMockBlobStorageManager;

  beforeAll(async () => {
    caller = await getCaller();
    callerWithClient = await getCaller({ withClient: true });
    callerWithMockBlobStorageManager = await getCaller({
      withClient: true,
      mockBlobStorageManager: true,
    });
  });

  describe("getSlot", () => {
    it("should return the current slot", async () => {
      const result = await caller.indexer.getSlot();

      expect(result).toMatchObject({ slot: 101 });
    });
  });

  describe("auth", () => {
    it("should not allow access to protected routes if not auth", async () => {
      await expect(caller.indexer.updateSlot(10)).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" })
      );

      await expect(caller.indexer.indexData(INDEXER_DATA)).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" })
      );
    });
  });

  describe("updateSlot", () => {
    it("should update the slot when auth", async () => {
      const input: UpdateSlotInput = {
        slot: 110,
      };

      await callerWithClient.indexer.updateSlot(input);

      const result = await caller.indexer.getSlot();

      expect(result).toMatchObject({ slot: 110 });
    });

    it("should update the slot for the first time", async () => {
      await prisma.blockchainSyncState.deleteMany();

      const input: UpdateSlotInput = {
        slot: 1,
      };
      await callerWithClient.indexer.updateSlot(input);

      const result = await prisma.blockchainSyncState.findFirst();
      expect(result).toMatchObject({
        id: 1,
        lastSlot: 1,
        lastFinalizedBlock: 0,
      });
    });
  });

  describe("indexData", () => {
    it("should index new data if auth", async () => {
      const input: IndexDataInput = INDEXER_DATA;

      await callerWithClient.indexer.indexData(input);

      const { block, addresses, txs, blobs, storageRefs, blobsOnTransactions } =
        await getIndexedData(caller);

      expect(block).toMatchSnapshot();
      expect(addresses).toMatchSnapshot();
      expect(txs).toMatchSnapshot();
      expect(blobs).toMatchSnapshot();
      expect(storageRefs).toMatchSnapshot();
      expect(blobsOnTransactions).toMatchSnapshot();

      expect(addresses).toHaveLength(8);
      expect(txs).toHaveLength(8);
      expect(blobs).toHaveLength(8);
      expect(storageRefs).toHaveLength(12);
      expect(blobsOnTransactions).toHaveLength(8);
    });

    it("should store new unique blobs correctly", async () => {
      blobStorageManager.storeBlob.mockResolvedValue({
        references: [
          {
            reference: "blobHash",
            storage: "POSTGRES",
          },
        ],
        errors: [],
      });

      await callerWithMockBlobStorageManager.indexer.indexData(INDEXER_DATA);

      // only 2 are new unique blobs, 1 is repeated
      expect(blobStorageManager.storeBlob).toHaveBeenCalledTimes(2);
    });

    it("should be idempotent", async () => {
      const outputBefore = await callerWithClient.indexer.indexData(
        INDEXER_DATA
      );
      const outputAfter = await callerWithClient.indexer.indexData(
        INDEXER_DATA
      );
      expect(outputBefore).toEqual(outputAfter);
    });
  });
});
