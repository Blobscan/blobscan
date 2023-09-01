import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";

import type { AppRouter } from "../src/root";
import { getCaller, INDEXER_DATA, getMockEnv } from "./helper";

type UpdateSlotInput = inferProcedureInput<AppRouter["indexer"]["updateSlot"]>;
type IndexDataInput = inferProcedureInput<AppRouter["indexer"]["indexData"]>;

vi.mock("../src/env", () => ({
  env: {
    SECRET_KEY: "supersecret",
  },
}));

vi.mock("@blobscan/blob-storage-manager/src/env", () => getMockEnv());

describe("Indexer route", async () => {
  let caller;
  let callerWithClient;

  beforeAll(async () => {
    caller = await getCaller();
    callerWithClient = await getCaller({ withClient: true });
  });

  describe("getSlot", () => {
    it("should return the current slot", async () => {
      const result = await caller.indexer.getSlot();

      expect(result).toMatchObject({ slot: 101 });
    });
  });

  describe("updateSlot", () => {
    it("should not update the slot if not auth", async () => {
      const input: UpdateSlotInput = {
        slot: 110,
      };

      await expect(caller.indexer.updateSlot(input)).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" })
      );
    });

    it("should update the slot if auth", async () => {
      const input: UpdateSlotInput = {
        slot: 110,
      };

      await callerWithClient.indexer.updateSlot(input);

      const result = await caller.indexer.getSlot();

      expect(result).toMatchObject({ slot: 110 });
    });
  });

  describe("indexData", () => {
    it("should index new data if auth", async () => {
      const input: IndexDataInput = INDEXER_DATA;

      await callerWithClient.indexer.indexData(input);

      const block = await caller.block.getByBlockNumber({
        number: 1003,
      });
      expect(block).toMatchSnapshot();

      const addresses = await prisma.address.findMany({
        select: {
          address: true,
        },
        orderBy: {
          address: "asc",
        },
      });
      expect(addresses).toMatchSnapshot();
      expect(addresses).toHaveLength(9);

      const txs = await prisma.transaction.findMany({
        select: {
          hash: true,
          blockNumber: true,
        },
        orderBy: {
          hash: "asc",
        },
      });
      expect(txs).toMatchSnapshot();
      expect(txs).toHaveLength(9);

      const blobs = await prisma.blob.findMany({
        select: {
          versionedHash: true,
          commitment: true,
          size: true,
          firstBlockNumber: true,
        },
        orderBy: {
          versionedHash: "asc",
        },
      });

      expect(blobs).toMatchSnapshot();
      expect(blobs).toHaveLength(9);

      const storageRefs = await prisma.blobDataStorageReference.findMany({
        select: {
          blobHash: true,
          blobStorage: true,
          dataReference: true,
        },
        orderBy: {
          blobHash: "asc",
        },
      });
      storageRefs.sort((a, b) => {
        // First, compare by blobHash
        if (a.blobHash < b.blobHash) return -1;
        if (a.blobHash > b.blobHash) return 1;

        // If blobHash is the same, compare by blobStorage
        if (a.blobStorage < b.blobStorage) return -1;
        if (a.blobStorage > b.blobStorage) return 1;

        return 0; // If everything is the same
      });
      expect(storageRefs).toMatchSnapshot();
      expect(storageRefs).toHaveLength(14);

      const blobsOnTransactions = await prisma.blobsOnTransactions.findMany({
        select: {
          blobHash: true,
          txHash: true,
          index: true,
        },
        orderBy: {
          blobHash: "asc",
        },
      });
      expect(blobsOnTransactions).toMatchSnapshot();
      expect(blobsOnTransactions).toHaveLength(9);
    });
  });
});
