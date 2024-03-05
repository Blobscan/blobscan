import type {
  Address as AddressEntity,
  Blob,
  BlobDataStorageReference,
  Transaction,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { BlobStorage } from "@prisma/client";
import { describe, it, expect, beforeEach } from "vitest";

import { fixtures, omitDBTimestampFields } from "@blobscan/test";

import type { WithoutTimestampFields } from "../../prisma";
import { prisma } from "../../prisma";
import type { UpsertAddrFromTxsInput } from "./base-extension.test.utils";
import { upsertAndRetrieveManyAddresses } from "./base-extension.test.utils";
import { upsertAndretrieveAddressesFromTxs } from "./base-extension.test.utils";

describe("Base Extension", () => {
  const expectedEmptyInputRes = [
    {
      count: 0,
    },
  ];

  describe("Address model", () => {
    describe("upsertAddressesFromTransactions()", () => {
      let input: UpsertAddrFromTxsInput;

      describe("when inserting addresses from transactions", () => {
        const newAddress = "newAddress";
        const expectedFirstBlockNumberAsSender = 1001;
        const expectedFirstBlockNumberAsReceiver = 1002;

        it("should insert an address correctly", async () => {
          input = [
            {
              from: newAddress,
              to: "address2",
              blockNumber: expectedFirstBlockNumberAsSender,
            },
          ];

          const { [newAddress]: addressEntity } =
            await upsertAndretrieveAddressesFromTxs(input);

          expect(addressEntity).toBeDefined();
          expect(addressEntity?.address).toBe(newAddress);
        });

        it("should insert an address that is a sender correctly", async () => {
          input = [
            {
              from: newAddress,
              to: "address1",
              blockNumber: expectedFirstBlockNumberAsSender,
            },
          ];

          const { [newAddress]: addressEntity } =
            await upsertAndretrieveAddressesFromTxs(input);

          expect(addressEntity?.firstBlockNumberAsSender).toBe(
            expectedFirstBlockNumberAsSender
          );
        });

        it("should insert an address that is a receiver correctly", async () => {
          input = [
            {
              from: "address1",
              to: newAddress,
              blockNumber: expectedFirstBlockNumberAsReceiver,
            },
          ];

          const { [newAddress]: addressEntity } =
            await upsertAndretrieveAddressesFromTxs(input);

          expect(addressEntity?.firstBlockNumberAsReceiver).toBe(
            expectedFirstBlockNumberAsReceiver
          );
        });

        it("should insert an address that is both a sender and a receiver correctly", async () => {
          input = [
            {
              from: newAddress,
              to: "address9999",
              blockNumber: expectedFirstBlockNumberAsSender,
            },
            {
              from: "anotherAddress",
              to: newAddress,
              blockNumber: expectedFirstBlockNumberAsReceiver,
            },
          ];

          const { [newAddress]: addressEntity } =
            await upsertAndretrieveAddressesFromTxs(input);

          expect(
            addressEntity?.firstBlockNumberAsSender,
            "First block number as sender mismatch"
          ).toBe(expectedFirstBlockNumberAsSender);
          expect(
            addressEntity?.firstBlockNumberAsReceiver,
            "First block number as receiver mismatch"
          ).toBe(expectedFirstBlockNumberAsReceiver);
        });
      });

      describe("when updating addresses from transactions", () => {
        describe("when updating an address that is a sender", () => {
          const senderAddress = "address5";

          it("should update it if new block number is lower than the current one", async () => {
            const smallerBlockNumber = 1001;
            input = [
              {
                from: senderAddress,
                to: "address2",
                blockNumber: smallerBlockNumber,
              },
            ];

            const { [senderAddress]: addressEntity } =
              await upsertAndretrieveAddressesFromTxs(input);

            expect(addressEntity?.firstBlockNumberAsSender).toBe(
              smallerBlockNumber
            );
          });

          it("should not update it if new block number is higher than the current one", async () => {
            const biggerBlockNumber = 1008;
            input = [
              {
                from: senderAddress,
                to: "address2",
                blockNumber: biggerBlockNumber,
              },
            ];

            const oldFirstBlockNumberAsSender = (
              await prisma.address.findUnique({
                where: {
                  address: senderAddress,
                },
              })
            )?.firstBlockNumberAsSender;

            const { [senderAddress]: addressEntity } =
              await upsertAndretrieveAddressesFromTxs(input);

            expect(addressEntity?.firstBlockNumberAsSender).toBe(
              oldFirstBlockNumberAsSender
            );
          });

          it("should upsert a sender address that appears in multiple transactions correctly", async () => {
            input = [
              {
                from: "address8",
                to: "address1",
                blockNumber: 1002,
              },
              {
                from: "address8",
                to: "address1",
                blockNumber: 1003,
              },
            ];
          });
        });

        describe("when updating an address that is a receiver", () => {
          const receiverAddress = "address3";

          it("should update it if new block number is lower than the current one", async () => {
            const smallerBlockNumber = 1001;
            input = [
              {
                from: "address1",
                to: receiverAddress,
                blockNumber: smallerBlockNumber,
              },
            ];

            const { [receiverAddress]: addressEntity } =
              await upsertAndretrieveAddressesFromTxs(input);

            expect(addressEntity?.firstBlockNumberAsReceiver).toBe(
              smallerBlockNumber
            );
          });

          it("should not update it if new block number is higher than the current one", async () => {
            input = [
              {
                from: "address1",
                to: receiverAddress,
                blockNumber: 99999,
              },
            ];

            const oldFirstBlockNumberAsReceiver = (
              await prisma.address.findUnique({
                where: {
                  address: receiverAddress,
                },
              })
            )?.firstBlockNumberAsReceiver;

            const { [receiverAddress]: addressEntity } =
              await upsertAndretrieveAddressesFromTxs(input);

            expect(addressEntity?.firstBlockNumberAsReceiver).toBe(
              oldFirstBlockNumberAsReceiver
            );
          });
        });

        it("should upsert addresses from multiple transactions correctly", async () => {
          input = [
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
              blockNumber: 1006,
            },
            {
              from: "address6",
              to: "address3",
              blockNumber: 1001,
            },
          ];

          const addressToEntity = await upsertAndretrieveAddressesFromTxs(
            input
          );
          const addressEntities = Object.values(addressToEntity);

          expect(addressEntities).toMatchSnapshot();
        });
      });

      it("should upsert an empty array correctly", async () => {
        input = [];

        const result = await prisma.address.upsertAddressesFromTransactions(
          input
        );

        expect(result).toStrictEqual(expectedEmptyInputRes);
      });
    });

    describe("upsertMany()", () => {
      let input: WithoutTimestampFields<AddressEntity>[];

      it("should insert multiple addresses correctly", async () => {
        input = [
          {
            address: "address9",
            firstBlockNumberAsSender: 1001,
            firstBlockNumberAsReceiver: 1002,
          },
          {
            address: "address10",
            firstBlockNumberAsSender: 1001,
            firstBlockNumberAsReceiver: 1002,
          },
          {
            address: "address11",
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
            firstBlockNumberAsReceiver: 1001,
            firstBlockNumberAsSender: 1001,
          },
          {
            address: "address2",
            firstBlockNumberAsReceiver: 1003,
            firstBlockNumberAsSender: 1005,
          },
          {
            address: "address6",
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
    describe("filterNewBlobs()", () => {
      const newRawBlob = {
        versionedHash: "newHash",
        commitment: "newCommitment",
        proof: "newProof",
        txHash: "txHash001",
        index: 0,
        data: "data001",
      };
      const { index: _, ...newBlob } = newRawBlob;

      it("should filter out stored blobs", async () => {
        const rawBlobs = [
          {
            versionedHash: "blobHash001",
            commitment: "commitment001",
            proof: "proof001",
            txHash: "txHash001",
            index: 0,
            data: "data001",
          },
          {
            versionedHash: "blobHash002",
            commitment: "commitment002",
            proof: "proof002",
            txHash: "txHash002",
            index: 0,
            data: "data002",
          },
          newRawBlob,
        ];

        await expect(
          prisma.blob.filterNewBlobs(rawBlobs)
        ).resolves.toStrictEqual([newBlob]);
      });

      it("should filter out duplicated blobs", async () => {
        const rawBlobs = [newRawBlob, newRawBlob];

        await expect(
          prisma.blob.filterNewBlobs(rawBlobs)
        ).resolves.toStrictEqual([newBlob]);
      });
    });

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
        blobAsCalldataGasUsed: new Prisma.Decimal(
          existingRawTx.blobAsCalldataGasUsed
        ),
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
            maxFeePerBlobGas: new Prisma.Decimal(100),
            gasPrice: new Prisma.Decimal(10),
            blobAsCalldataGasUsed: new Prisma.Decimal(1000),
          },
          {
            hash: "newTxHash2",
            fromId: "address5",
            toId: "address3",
            blockHash: "blockHash001",
            maxFeePerBlobGas: new Prisma.Decimal(120),
            gasPrice: new Prisma.Decimal(5),
            blobAsCalldataGasUsed: new Prisma.Decimal(500),
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
            maxFeePerBlobGas: new Prisma.Decimal(1),
            gasPrice: new Prisma.Decimal(1),
            blobAsCalldataGasUsed: new Prisma.Decimal(1),
          },
          {
            hash: "txHash002",
            fromId: "address6",
            toId: "address5",
            blockHash: "blockHash006",
            maxFeePerBlobGas: new Prisma.Decimal(999),
            gasPrice: new Prisma.Decimal(999),
            blobAsCalldataGasUsed: new Prisma.Decimal(999),
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
