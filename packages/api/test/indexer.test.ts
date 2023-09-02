import { TRPCError } from "@trpc/server";
import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";

import type { AppRouter } from "../src/root";
import { getCaller, INDEXER_DATA } from "./helper";

type UpdateSlotInput = inferProcedureInput<AppRouter["indexer"]["updateSlot"]>;
type IndexDataInput = inferProcedureInput<AppRouter["indexer"]["indexData"]>;

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

      const [block, addresses, txs, blobs, storageRefs, blobsOnTransactions] =
        await Promise.all([
          caller.block.getByBlockNumber({
            number: 1003,
          }),
          prisma.address.findMany({
            select: {
              address: true,
            },
            orderBy: {
              address: "asc",
            },
          }),
          prisma.transaction.findMany({
            select: {
              hash: true,
              blockNumber: true,
            },
            orderBy: {
              hash: "asc",
            },
          }),
          prisma.blob.findMany({
            select: {
              versionedHash: true,
              commitment: true,
              size: true,
              firstBlockNumber: true,
            },
            orderBy: {
              versionedHash: "asc",
            },
          }),
          prisma.blobDataStorageReference.findMany({
            select: {
              blobHash: true,
              blobStorage: true,
              dataReference: true,
            },
            orderBy: {
              blobHash: "asc",
            },
          }),
          prisma.blobsOnTransactions.findMany({
            select: {
              blobHash: true,
              txHash: true,
              index: true,
            },
            orderBy: {
              blobHash: "asc",
            },
          }),
        ]);

      storageRefs.sort((a, b) => {
        // First, compare by blobHash
        if (a.blobHash < b.blobHash) return -1;
        if (a.blobHash > b.blobHash) return 1;

        // If blobHash is the same, compare by blobStorage
        if (a.blobStorage < b.blobStorage) return -1;
        if (a.blobStorage > b.blobStorage) return 1;

        return 0; // If everything is the same
      });

      expect(block).toMatchSnapshot();
      expect(addresses).toMatchSnapshot();
      expect(txs).toMatchSnapshot();
      expect(blobs).toMatchSnapshot();
      expect(storageRefs).toMatchSnapshot();
      expect(blobsOnTransactions).toMatchSnapshot();

      expect(addresses).toHaveLength(9);
      expect(txs).toHaveLength(9);
      expect(blobs).toHaveLength(9);
      expect(storageRefs).toHaveLength(14);
      expect(blobsOnTransactions).toHaveLength(9);
    });
  });
});
