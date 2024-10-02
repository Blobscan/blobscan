import type {
  AddressCategoryInfo,
  Address as AddressEntity,
  Blob,
  BlobDataStorageReference,
  BlobsOnTransactions,
  Transaction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { BlobStorage } from "@prisma/client";
import { describe, it, expect, beforeEach } from "vitest";

import { fixtures, omitDBTimestampFields } from "@blobscan/test";

import { prisma } from "../prisma";
import type { WithoutTimestampFields } from "../prisma/types";
import { upsertAndRetrieveManyAddresses } from "./base-extension.test.utils";

describe("Base Extension", () => {
  const expectedEmptyInputRes = [
    {
      count: 0,
    },
  ];

  describe("Address model", () => {
    let input: WithoutTimestampFields<AddressEntity>[];

    it("should insert multiple addresses correctly", async () => {
      input = [
        {
          address: "address90",
        },
        {
          address: "address91",
        },
        {
          address: "address92",
        },
      ];

      await prisma.address.upsertMany(input);

      const insertedAddresses = await prisma.address
        .findMany({
          where: {
            address: {
              in: input.map((a) => a.address),
            },
          },
          orderBy: {
            address: "asc",
          },
        })
        .then((addresses) => addresses.map((a) => omitDBTimestampFields(a)));

      expect(insertedAddresses).toStrictEqual(input);
    });

    it("should upsert an empty array correctly", async () => {
      const result = await prisma.address.upsertMany([]);

      expect(result).toStrictEqual(expectedEmptyInputRes);
    });
  });

  describe("Address Category Info model", () => {
    describe("upsertMany()", () => {
      let input: Omit<AddressCategoryInfo, "id">[];

      it("should insert multiple addresses correctly", async () => {
        input = [
          {
            address: "address9",
            category: "OTHER",
            firstBlockNumberAsSender: 1001,
            firstBlockNumberAsReceiver: 1002,
          },
          {
            address: "address10",
            category: "OTHER",
            firstBlockNumberAsSender: 1001,
            firstBlockNumberAsReceiver: 1002,
          },
          {
            address: "address11",
            category: "OTHER",
            firstBlockNumberAsSender: 1001,
            firstBlockNumberAsReceiver: 1002,
          },
        ];

        const insertedAddresses = await upsertAndRetrieveManyAddresses(
          input
        ).then((addressToEntity) => Object.values(addressToEntity));

        expect(insertedAddresses).toMatchSnapshot();
      });

      it("update multiple addresses correctly", async () => {
        input = [
          {
            address: "address5",
            category: "OTHER",
            firstBlockNumberAsReceiver: 1001,
            firstBlockNumberAsSender: 1001,
          },
          {
            address: "address2",
            category: "OTHER",
            firstBlockNumberAsReceiver: 1003,
            firstBlockNumberAsSender: 1005,
          },
          {
            address: "address6",
            category: "OTHER",
            firstBlockNumberAsReceiver: 1001,
            firstBlockNumberAsSender: 1001,
          },
        ];

        const updatedAddresses = await upsertAndRetrieveManyAddresses(
          input
        ).then((addressToEntity) => Object.values(addressToEntity));

        expect(updatedAddresses).toMatchSnapshot();
      });

      it("should upsert an empty array correctly", async () => {
        input = [];

        const result = await prisma.address.upsertMany(input);

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });
    });
  });

  describe("Blob model", () => {
    describe("upsertMany()", () => {
      it("should insert multiple blobs correctly", async () => {
        const newBlobs: WithoutTimestampFields<Blob>[] = [
          {
            versionedHash: "newHash1",
            commitment: "newCommitment1",
            proof: "newProof1",
            size: 1400,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "newHash2",
            commitment: "newCommitment2",
            proof: "newProof2",
            size: 1200,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "newHash3",
            commitment: "newCommitment3",
            proof: "newProof3",
            size: 1300,
            firstBlockNumber: 1002,
          },
        ];

        await prisma.blob.upsertMany(newBlobs);

        const result = await prisma.blob
          .findMany({
            where: {
              versionedHash: {
                in: newBlobs.map((b) => b.versionedHash),
              },
            },
            orderBy: {
              versionedHash: "asc",
            },
          })
          .then((blobs) => blobs.map((b) => omitDBTimestampFields(b)));

        expect(result).toStrictEqual(newBlobs);
      });

      describe("when updating a single blob", () => {
        const blobHash = "blobHash006";
        let oldBlob: WithoutTimestampFields<Blob>;

        beforeEach(async () => {
          oldBlob = await prisma.blob
            .findUnique({
              where: {
                versionedHash: blobHash,
              },
            })
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .then((b) => omitDBTimestampFields(b!));
        });

        it("should update all blob's fields correctly", async () => {
          const expectedUpdatedBlob = {
            versionedHash: blobHash,
            commitment: "newCommitment",
            proof: "newProof",
            size: 1400,
            firstBlockNumber: oldBlob.firstBlockNumber,
          };

          await prisma.blob.upsertMany([expectedUpdatedBlob]);

          const updatedBlob = await prisma.blob
            .findUnique({
              where: {
                versionedHash: blobHash,
              },
            })
            .then((b) => (b ? omitDBTimestampFields(b) : null));

          expect(updatedBlob).toStrictEqual(expectedUpdatedBlob);
        });

        it("should update a blob's first block number when new one is lower", async () => {
          const lowerBlockNumber = 1001;

          await prisma.blob.upsertMany([
            {
              ...oldBlob,
              firstBlockNumber: lowerBlockNumber,
            },
          ]);

          const updatedBlob = await prisma.blob.findUnique({
            where: {
              versionedHash: blobHash,
            },
          });

          expect(updatedBlob?.firstBlockNumber).toBe(lowerBlockNumber);
        });

        it("should not update a blob's first block number when new one is lower", async () => {
          const higherBlockNumber = 1006;

          await prisma.blob.upsertMany([
            {
              ...oldBlob,
              firstBlockNumber: higherBlockNumber,
            },
          ]);

          const updatedBlob = await prisma.blob.findUnique({
            where: {
              versionedHash: blobHash,
            },
          });

          expect(updatedBlob?.firstBlockNumber).toBe(oldBlob.firstBlockNumber);
        });
      });

      it("should update multiple blobs correctly", async () => {
        const blobs = [
          {
            versionedHash: "blobHash001",
            commitment: "newCommitment001",
            proof: "newProof001",
            size: 1,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "blobHash002",
            commitment: "newCommitment002",
            proof: "newProof002",
            size: 2,
            firstBlockNumber: 1001,
          },
          {
            versionedHash: "blobHash003",
            commitment: "newCommitment003",
            proof: "newProof003",
            size: 3,
            firstBlockNumber: 1001,
          },
        ];

        await prisma.blob.upsertMany(blobs);

        const updatedBlobs = await prisma.blob
          .findMany({
            where: {
              versionedHash: {
                in: blobs.map((b) => b.versionedHash),
              },
            },
            orderBy: {
              versionedHash: "asc",
            },
          })
          .then((blobs) => blobs.map((b) => omitDBTimestampFields(b)));

        expect(updatedBlobs).toStrictEqual(blobs);
      });

      it("should upsert an empty array correctly", async () => {
        const result = await prisma.blob.upsertMany([]);

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });
    });
  });

  describe("BlobsOnTransactions model", () => {
    describe("upsertMany()", () => {
      const newBlobsOnTransactions: WithoutTimestampFields<BlobsOnTransactions>[] =
        [
          {
            blobHash: "blobHash002",
            blockHash: "blockHash005",
            blockNumber: 1008,
            blockTimestamp: new Date("2023-08-31T16:00:00Z"),
            txHash: "txHash016",
            txIndex: 0,
            index: 1,
          },
          {
            blobHash: "blobHash003",
            blockHash: "blockHash008",
            blockNumber: 1008,
            blockTimestamp: new Date("2023-08-31T16:00:00Z"),
            txHash: "txHash016",
            txIndex: 0,
            index: 2,
          },
        ];
      it("should insert multiple blobs on transactions correctly", async () => {
        await prisma.blobsOnTransactions.upsertMany(newBlobsOnTransactions);

        const result = await prisma.blobsOnTransactions.findMany({
          where: {
            AND: [
              {
                txHash: {
                  in: newBlobsOnTransactions.map((btx) => btx.txHash),
                },
              },
              {
                index: {
                  in: newBlobsOnTransactions.map((btx) => btx.index),
                },
              },
            ],
          },
          orderBy: [
            {
              txHash: "asc",
            },
            {
              index: "asc",
            },
          ],
        });

        expect(result).toStrictEqual(newBlobsOnTransactions);
      });

      it("should update multiple blobs on transactions correctly", async () => {
        await prisma.blobsOnTransactions.upsertMany(newBlobsOnTransactions);

        const updatedBlobsOnTransactions = newBlobsOnTransactions.map(
          (btx) => ({
            ...btx,
            blockHash: "blockHash007",
            blockNumber: 1007,
            blockTimestamp: new Date("2023-08-31T14:00:00Z"),
          })
        );

        await prisma.blobsOnTransactions.upsertMany(updatedBlobsOnTransactions);

        const result = await prisma.blobsOnTransactions.findMany({
          where: {
            AND: [
              {
                txHash: {
                  in: updatedBlobsOnTransactions.map((btx) => btx.txHash),
                },
              },
              {
                index: {
                  in: updatedBlobsOnTransactions.map((btx) => btx.index),
                },
              },
            ],
          },
          orderBy: [
            {
              txHash: "asc",
            },
            {
              index: "asc",
            },
          ],
        });

        expect(result).toStrictEqual(updatedBlobsOnTransactions);
      });

      it("should upsert an empty array correctly", async () => {
        const result = await prisma.blobsOnTransactions.upsertMany([]);

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });
    });
  });

  describe("BlobDataStorageReference model", () => {
    const newBlob: WithoutTimestampFields<Blob> = {
      commitment: "newCommitment",
      proof: "newProof",
      versionedHash: "newHash",
      size: 1000,
      firstBlockNumber: 1001,
    };

    describe("upsertMany()", () => {
      let input: BlobDataStorageReference[] = [];

      it("should insert multiple references", async () => {
        input = [
          {
            blobHash: newBlob.versionedHash,
            blobStorage: BlobStorage.POSTGRES,
            dataReference: "newReference",
          },
          {
            blobHash: newBlob.versionedHash,
            blobStorage: BlobStorage.SWARM,
            dataReference: "newReference",
          },
        ];

        await prisma.blob.create({
          data: newBlob,
        });

        await prisma.blobDataStorageReference.upsertMany(input);

        const insertedRefs = await prisma.blobDataStorageReference.findMany({
          where: {
            blobHash: newBlob.versionedHash,
          },
          orderBy: {
            blobStorage: "asc",
          },
        });

        expect(insertedRefs).toStrictEqual(input);
      });

      it("should update multiple references", async () => {
        input = [
          {
            blobHash: "blobHash001",
            blobStorage: BlobStorage.GOOGLE,
            dataReference: "updatedReference",
          },
          {
            blobHash: "blobHash001",
            blobStorage: BlobStorage.SWARM,
            dataReference: "updatedReference",
          },
          {
            blobHash: "blobHash002",
            blobStorage: BlobStorage.GOOGLE,
            dataReference: "updatedReference",
          },
        ];

        await prisma.blobDataStorageReference.upsertMany(input);

        const updatedBlobVersionedHashes = Array.from(
          new Set(input.map((r) => r.blobHash))
        );
        const updatedRefs = await prisma.blobDataStorageReference.findMany({
          where: {
            blobHash: {
              in: updatedBlobVersionedHashes,
            },
          },
          orderBy: [
            {
              blobHash: "asc",
            },
            {
              blobStorage: "asc",
            },
          ],
        });

        expect(updatedRefs).toStrictEqual(input);
      });

      it("should upsert an empty array correctly", async () => {
        const result = await prisma.blobDataStorageReference.upsertMany([]);

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });

      it("should fail when upserting a reference for a non-existent blob", async () => {
        input = [
          {
            blobHash: "nonExistentBlobHash",
            blobStorage: BlobStorage.GOOGLE,
            dataReference: "reference",
          },
        ];

        await expect(
          prisma.blobDataStorageReference.upsertMany(input)
        ).rejects.toThrowErrorMatchingSnapshot();
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
      let input: WithoutTimestampFields<Transaction>[];
      const {
        insertedAt: _,
        updatedAt: __,
        ...existingRawTx
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      } = fixtures.txs[0]!;
      const existingTx: WithoutTimestampFields<Transaction> = {
        ...existingRawTx,
        blockTimestamp: new Date(existingRawTx.blockTimestamp),
        blobAsCalldataGasUsed: new Prisma.Decimal(
          existingRawTx.blobAsCalldataGasUsed
        ),
        blobGasUsed: new Prisma.Decimal(existingRawTx.blobGasUsed),
        maxFeePerBlobGas: new Prisma.Decimal(existingRawTx.maxFeePerBlobGas),
        gasPrice: new Prisma.Decimal(existingRawTx.gasPrice),
      };

      it("should insert multiple transactions correctly", async () => {
        input = [
          {
            hash: "newTxHash1",
            fromId: "address1",
            toId: "address3",
            blockHash: "blockHash002",
            blockNumber: 1002,
            blockTimestamp: new Date("2023-05-10T12:00:00Z"),
            index: 0,
            maxFeePerBlobGas: new Prisma.Decimal(100),
            gasPrice: new Prisma.Decimal(10),
            blobAsCalldataGasUsed: new Prisma.Decimal(1000),
            blobGasUsed: new Prisma.Decimal(1000),
            category: "ROLLUP",
            rollup: "OPTIMISM",
          },
          {
            hash: "newTxHash2",
            fromId: "address5",
            toId: "address3",
            blockHash: "blockHash001",
            blockNumber: 1001,
            index: 0,
            blockTimestamp: new Date("2022-10-16T12:00:00Z"),
            maxFeePerBlobGas: new Prisma.Decimal(120),
            gasPrice: new Prisma.Decimal(5),
            blobAsCalldataGasUsed: new Prisma.Decimal(500),
            blobGasUsed: new Prisma.Decimal(500),
            category: "ROLLUP",
            rollup: "BASE",
          },
        ];

        await prisma.transaction.upsertMany(input);

        const insertedTxs = await prisma.transaction
          .findMany({
            where: {
              hash: {
                in: input.map((tx) => tx.hash),
              },
            },
            orderBy: {
              hash: "asc",
            },
          })
          .then((txs) => txs.map((tx) => omitDBTimestampFields(tx)));

        expect(insertedTxs).toStrictEqual(input);
      });

      it("should update multiple transactions correctly", async () => {
        input = [
          {
            hash: "txHash001",
            fromId: "address5",
            toId: "address6",
            blockHash: "blockHash006",
            blockNumber: 1006,
            index: 0,
            blockTimestamp: new Date("2023-08-31T12:00:00Z"),
            maxFeePerBlobGas: new Prisma.Decimal(1),
            gasPrice: new Prisma.Decimal(1),
            blobAsCalldataGasUsed: new Prisma.Decimal(1),
            blobGasUsed: new Prisma.Decimal(1),
            category: "ROLLUP",
            rollup: "ARBITRUM",
          },
          {
            hash: "txHash002",
            fromId: "address6",
            toId: "address5",
            blockHash: "blockHash006",
            blockNumber: 1006,
            index: 1,
            blockTimestamp: new Date("2023-08-31T12:00:00Z"),
            maxFeePerBlobGas: new Prisma.Decimal(999),
            gasPrice: new Prisma.Decimal(999),
            blobAsCalldataGasUsed: new Prisma.Decimal(999),
            blobGasUsed: new Prisma.Decimal(999),
            category: "ROLLUP",
            rollup: "OPTIMISM",
          },
        ];

        await prisma.transaction.upsertMany(input);

        const updatedTxs = await prisma.transaction
          .findMany({
            where: {
              hash: {
                in: input.map((tx) => tx.hash),
              },
            },
            orderBy: {
              hash: "asc",
            },
          })
          .then((txs) => txs.map((tx) => omitDBTimestampFields(tx)));

        expect(updatedTxs).toStrictEqual(input);
      });

      it("should upsert an empty array correctly", async () => {
        const result = await prisma.transaction.upsertMany([]);

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });

      it("should fail when upserting a transaction with a non-existent block", async () => {
        input = [
          {
            ...existingTx,
            blockHash: "blockHash9999999",
          },
        ];

        await expect(
          prisma.transaction.upsertMany(input)
        ).rejects.toThrowErrorMatchingSnapshot();
      });

      it("should fail when upserting a transaction with a non-existent sender address", async () => {
        input = [
          {
            ...existingTx,
            fromId: "nonExistentAddress",
          },
        ];

        await expect(
          prisma.transaction.upsertMany(input)
        ).rejects.toThrowErrorMatchingSnapshot();
      });

      it("should fail when upserting a transaction with a non-existent receiver address", async () => {
        input = [
          {
            ...existingTx,
            toId: "nonExistentAddress",
          },
        ];

        await expect(
          prisma.transaction.upsertMany(input)
        ).rejects.toThrowErrorMatchingSnapshot();
      });
    });
  });
});
