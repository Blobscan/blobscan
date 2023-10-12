import type { Transaction } from "@prisma/client";
import { BlobStorage } from "@prisma/client";
import { describe, it, expect } from "vitest";

import { fixtures } from "@blobscan/test";

import type { OmittableFields } from "../../prisma";
import { prisma } from "../../prisma";

describe("Base Extension", () => {
  describe("Address model", () => {
    describe("upsertAddressesFromTransactions()", () => {
      it("should upsert addresses from transactions correctly", async () => {
        const txs = [
          {
            from: "address8",
            to: "address1",
            blockNumber: 1002,
          },
          {
            from: "address4",
            to: "address8",
            blockNumber: 1002,
          },
          {
            from: "address3",
            to: "address4",
            blockNumber: 1002,
          },
          {
            from: "address6",
            to: "address3",
            blockNumber: 1002,
          },
        ];
        await prisma.address.upsertAddressesFromTransactions(txs);

        const [all, address1, address3, address8] = await Promise.all([
          prisma.address.findMany({
            select: {
              address: true,
              firstBlockNumberAsSender: true,
              firstBlockNumberAsReceiver: true,
            },
            orderBy: {
              address: "asc",
            },
          }),
          prisma.address.findUnique({
            select: {
              address: true,
              firstBlockNumberAsSender: true,
              firstBlockNumberAsReceiver: true,
            },
            where: {
              address: "address1",
            },
          }),
          prisma.address.findUnique({
            select: {
              address: true,
              firstBlockNumberAsSender: true,
              firstBlockNumberAsReceiver: true,
            },
            where: {
              address: "address3",
            },
          }),
          prisma.address.findUnique({
            select: {
              address: true,
              firstBlockNumberAsSender: true,
              firstBlockNumberAsReceiver: true,
            },
            where: {
              address: "address8",
            },
          }),
        ]);

        expect(all).toHaveLength(7);
        expect(all).toMatchSnapshot();

        // Existing address should create new field
        expect(address1?.firstBlockNumberAsReceiver).toBe(1002);

        // Existing address should not update fields
        expect(address3?.firstBlockNumberAsReceiver).toBe(1002);
        expect(address3?.firstBlockNumberAsSender).toBe(1001);

        // New address should create both fields
        expect(address8?.firstBlockNumberAsReceiver).toBe(1002);
        expect(address8?.firstBlockNumberAsSender).toBe(1002);
      });
    });

    describe("upsertMany()", () => {
      it("upsert multiple addresses correctly");
    });
  });

  describe("Blob model", () => {
    describe("filterNewBlobs()", () => {
      it("should filter new blobs given a set of them correctly", async () => {
        const rawBlobs = [
          {
            versionedHash: "blobHash001",
            commitment: "commitment001",
            txHash: "txHash001",
            index: 0,
            data: "data001",
          },
          {
            versionedHash: "blobHash002",
            commitment: "commitment002",
            txHash: "txHash002",
            index: 0,
            data: "data002",
          },
          {
            versionedHash: "blobHash007",
            commitment: "commitment007",
            txHash: "txHash007",
            index: 0,
            data: "data007",
          },
          {
            versionedHash: "blobHash008",
            commitment: "commitment008",
            txHash: "txHash008",
            index: 0,
            data: "data008",
          },
        ];

        const result = await prisma.blob.filterNewBlobs(rawBlobs);

        expect(result).toHaveLength(2);
        expect(result).toMatchSnapshot();
      });
    });

    it("upsertMany()", () => {
      it("should insert multiple blobs correctly", async () => {
        const blobs = [
          {
            versionedHash: "blobHash005",
            commitment: "newCommitment005",
            size: 1400,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "blobHash006",
            commitment: "commitment006",
            size: 1200,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "blobHash007",
            commitment: "commitment007",
            size: 1300,
            firstBlockNumber: 1002,
          },
        ];

        await prisma.blob.upsertMany(blobs);

        const result = await prisma.blob.findMany({
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
        expect(result).toHaveLength(8);
        expect(result).toMatchSnapshot();
      });

      it("should update multiple blobs correctly");
    });
  });

  describe("BlobDataStorageReference model", () => {
    describe("upsertMany()", () => {
      it("should upsert many references", async () => {
        const refs = [
          {
            blobHash: "blobHash001",
            blobStorage: BlobStorage.GOOGLE,
            dataReference: "gs://new-bucket/blobHash001",
          },
          {
            blobHash: "blobHash001",
            blobStorage: BlobStorage.SWARM,
            dataReference: "bzz://some-newhash-for-blobHash001",
          },
          {
            blobHash: "blobHash002",
            blobStorage: BlobStorage.GOOGLE,
            dataReference: "gs://new-bucket/blobHash002",
          },
        ];

        await prisma.blobDataStorageReference.upsertMany(refs);

        const result = await prisma.blobDataStorageReference.findMany({
          where: {
            blobHash: {
              in: ["blobHash001", "blobHash002"],
            },
          },
          select: {
            blobHash: true,
            blobStorage: true,
            dataReference: true,
          },
        });

        expect(result).toHaveLength(3);
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe("Block model", () => {
    describe("findLatest()", () => {
      it("should find the latest block correctly", async () => {
        const result = await prisma.block.findLatest();

        expect(result).toMatchSnapshot();
      });
    });
  });

  describe("Transaction model", () => {
    describe("upsertMany()", () => {
      it("should insert multiple transactions correctly", async () => {
        const expectedTransactionsLength = fixtures.txs.length;
        const transactions: Omit<Transaction, OmittableFields>[] = [
          {
            hash: "txHash001",
            fromId: "address1",
            toId: "address3",
            blockNumber: 1002,
            maxFeePerBlobGas: BigInt(100),
            gasPrice: BigInt(10),
            blobAsCalldataGasUsed: 1000,
          },
          {
            hash: "txHash003",
            fromId: "address5",
            toId: "address3",
            blockNumber: 1001,
            maxFeePerBlobGas: BigInt(120),
            gasPrice: BigInt(5),
            blobAsCalldataGasUsed: 500,
          },
          {
            hash: "txHash004",
            fromId: "address1",
            toId: "address3",
            blockNumber: 1002,
            maxFeePerBlobGas: BigInt(100),
            gasPrice: BigInt(10),
            blobAsCalldataGasUsed: 1000,
          },
          {
            hash: "txHash008",
            fromId: "address5",
            toId: "address6",
            blockNumber: 1002,
            maxFeePerBlobGas: BigInt(100),
            gasPrice: BigInt(10),
            blobAsCalldataGasUsed: 1000,
          },
        ];

        await prisma.transaction.upsertMany(transactions);

        const result = await prisma.transaction.findMany({
          select: {
            hash: true,
            fromId: true,
            toId: true,
            blockNumber: true,
            maxFeePerBlobGas: true,
            gasPrice: true,
            blobAsCalldataGasUsed: true,
          },
          orderBy: {
            hash: "asc",
          },
        });
        expect(result).toHaveLength(expectedTransactionsLength);
        expect(result).toMatchSnapshot();
      });

      it("should update multiple transactions correctly");
    });
  });
});
