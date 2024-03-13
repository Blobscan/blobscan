import { faker } from "@faker-js/faker";
import type { Address, Blob, BlobsOnTransactions } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { sha256 } from "js-sha256";

import dayjs from "@blobscan/dayjs";

import type { SeedParams } from "./params";

function bigintToDecimal(bigint: bigint): Prisma.Decimal {
  return new Prisma.Decimal(bigint.toString());
}

export class DataGenerator {
  #seedParams: SeedParams;

  constructor(seedParams: SeedParams) {
    this.#seedParams = seedParams;
  }

  generateUniqueAddresses(): string[] {
    return Array.from({ length: this.#seedParams.maxUniqueAddresses }).map(() =>
      faker.finance.ethereumAddress()
    );
  }

  generateDBAddresses(
    addresses: string[],
    txs: Prisma.TransactionCreateManyInput[],
    blocks: Prisma.BlockCreateManyInput[]
  ): Address[] {
    const now = new Date();
    return addresses.map((address) => ({
      address,
      firstBlockNumberAsReceiver:
        blocks.find(
          (b) => txs.find((tx) => tx.toId === address)?.blockHash === b.hash
        )?.number ?? null,
      firstBlockNumberAsSender:
        blocks.find(
          (b) => txs.find((tx) => tx.fromId === address)?.blockHash === b.hash
        )?.number ?? null,
      insertedAt: now,
      updatedAt: now,
    }));
  }

  generateDBBlobs(): Blob[] {
    const now = new Date();
    const blobs: Blob[] = [];

    for (let i = 0; i < this.#seedParams.maxUniqueBlobs; i++) {
      const commitment = faker.string.hexadecimal({
        length: 96,
      });
      const proof = faker.string.hexadecimal({ length: 96 });
      const versionedHash = `0x01${sha256(commitment).slice(2)}`;
      const dataLength = faker.number.int({
        min: this.#seedParams.maxBlobBytesSize,
        max: this.#seedParams.maxBlobBytesSize * 2,
      });
      const size = dataLength % 2 === 0 ? dataLength : dataLength + 1;

      blobs.push({
        commitment,
        proof,
        size,
        versionedHash,
        firstBlockNumber: Infinity,
        insertedAt: now,
        updatedAt: now,
      });
    }

    return blobs;
  }

  generateBlobData(sizes: number[]): string[] {
    return sizes.map((s) => faker.string.hexadecimal({ length: s }));
  }

  generateDBBlobOnTxs(
    blocks: Prisma.BlockCreateManyInput[],
    blocksTxs: Prisma.TransactionCreateManyInput[][],
    uniqueBlobs: Blob[]
  ) {
    return blocksTxs.flatMap((blockTxs) => {
      let blockBlobsRemaining = faker.number.int({
        min: 1,
        max: this.#seedParams.maxBlobsPerBlock,
      });
      return blockTxs.flatMap((tx, i) => {
        const remainingTxs = blockTxs.length - i + 1;
        const txBlobs = faker.number.int({
          min: 1,
          max: Math.max(1, blockBlobsRemaining - remainingTxs),
        });

        blockBlobsRemaining -= txBlobs;

        const blobsOnTxs: BlobsOnTransactions[] = [];

        for (let i = 0; i < txBlobs; i++) {
          const blobIndex = faker.number.int({
            min: 0,
            max: uniqueBlobs.length - 1,
          });

          const blob =
            uniqueBlobs.find((b) => b.firstBlockNumber === Infinity) ??
            uniqueBlobs[blobIndex];

          if (!blob) {
            throw new Error("Blob not found");
          }

          blob.firstBlockNumber = Math.min(
            blob.firstBlockNumber ?? Infinity,
            blocks.find((b) => b.hash === tx.blockHash)?.number ?? Infinity
          );

          blobsOnTxs.push({
            blobHash: blob.versionedHash,
            index: i,
            txHash: tx.hash,
          });
        }

        return blobsOnTxs;
      });
    });
  }

  generateDBBlocks() {
    const now = new Date();
    const timestamps = this.#generateUniqueTimestamps(
      this.#seedParams.totalDays,
      this.#seedParams.minBlocksPerDay,
      this.#seedParams.maxBlocksPerDay
    );

    let prevBlockNumber = 0;
    let prevSlot = 0;

    return timestamps.map<Prisma.BlockCreateManyInput>((timestamp) => {
      const number = prevBlockNumber + faker.number.int({ min: 1, max: 20 });
      const slot = prevSlot + faker.number.int({ min: 1, max: 10 });
      const txsCount = faker.number.int({
        min: 1,
        max: this.#seedParams.maxBlobsPerBlock,
      });
      const blobGasUsed = faker.number.int({
        min: this.#seedParams.gasPerBlob * txsCount,
      });
      const blobGasPrice = faker.number.bigInt({
        min: this.#seedParams.minBlobGasPrice,
        max: this.#seedParams.maxBlobGasPrice,
      });
      const excessBlobGas = faker.number.int({
        min: 15_000_000,
        max: 20_000_000,
      });

      prevBlockNumber = number;
      prevSlot = slot;

      return {
        hash: faker.string.hexadecimal({ length: 64 }),
        number,
        timestamp,
        slot,
        blobGasAsCalldataUsed: 0,
        blobGasUsed: new Prisma.Decimal(blobGasUsed),
        blobGasPrice: bigintToDecimal(blobGasPrice),
        excessBlobGas: new Prisma.Decimal(excessBlobGas),
        insertedAt: now,
        updatedAt: now,
      };
    });
  }

  #generateUniqueTimestamps(
    days: number,
    minTimestamps: number,
    maxTimestamps: number
  ) {
    const uniqueTimestamps: Date[] = [];

    let startDay = dayjs().subtract(days, "day");

    Array.from({ length: days }).forEach(() => {
      const dayTimestamps = faker.number.int({
        min: minTimestamps,
        max: maxTimestamps,
      });
      const timestamps = new Set<Date>();

      let previousTimestamp: dayjs.Dayjs = startDay;

      Array.from({ length: dayTimestamps }).forEach(() => {
        const blocksUntilNextTimestamp = faker.number.int({ min: 1, max: 3 });
        const blockValidationTime = faker.number.int({ min: 10, max: 15 });
        const timestamp = previousTimestamp.add(
          blocksUntilNextTimestamp * blockValidationTime,
          "second"
        );

        timestamps.add(timestamp.toDate());

        previousTimestamp = timestamp;
      });

      uniqueTimestamps.push(...Array.from(timestamps).sort());

      startDay = startDay.add(1, "day");
    });

    return uniqueTimestamps;
  }

  generateDBBlockTransactions(
    blocks: Prisma.BlockCreateManyInput[],
    uniqueAddresses: string[]
  ) {
    const now = new Date();

    return blocks.map((block) => {
      const txCount = faker.number.int({
        min: 1,
        max: this.#seedParams.maxBlobsPerBlock,
      });

      return Array.from({
        length: txCount,
      }).map<Prisma.TransactionCreateManyInput>(() => {
        const txHash = faker.string.hexadecimal({ length: 64 });
        const from =
          uniqueAddresses[faker.number.int(uniqueAddresses.length - 1)];
        const to =
          uniqueAddresses[faker.number.int(uniqueAddresses.length - 1)];
        const gasPrice = faker.number.bigInt({
          min: this.#seedParams.minGasPrice,
          max: this.#seedParams.maxGasPrice,
        });
        const maxFeePerBlobGas = faker.number.bigInt({
          min: 0,
          max: this.#seedParams.maxFeePerBlobGas,
        });

        // Unreachable code, done only for type checking
        if (!from || !to) throw new Error("Address not found");

        return {
          hash: txHash,
          fromId: from,
          toId: to,
          blockHash: block.hash,
          blobGasAsCalldataUsed: new Prisma.Decimal(0),
          gasPrice: bigintToDecimal(gasPrice),
          maxFeePerBlobGas: bigintToDecimal(maxFeePerBlobGas),
          insertedAt: now,
          updatedAt: now,
        };
      });
    });
  }

  calculateEIP2028GasCost(hexData: string): number {
    const bytes = Buffer.from(hexData.slice(2), "hex");
    let gasCost = 0;

    for (const byte of bytes.entries()) {
      if (byte[1] === 0) {
        gasCost += 4;
      } else {
        gasCost += 16;
      }
    }

    return gasCost;
  }
}
