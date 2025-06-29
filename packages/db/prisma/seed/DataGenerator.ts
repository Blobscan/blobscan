import { faker } from "@faker-js/faker";
import type {
  Address,
  Blob,
  BlobDataStorageReference,
  Block,
  Transaction,
  TransactionFork,
} from "@prisma/client";
import { Category, Prisma } from "@prisma/client";
import { sha256 } from "js-sha256";

import dayjs from "@blobscan/dayjs";
import { FORK_BLOB_CONFIGS } from "@blobscan/network-blob-config";

import type { Rollup } from "../enums";
import { BlobStorage } from "../enums";
import type { SeedParams } from "./params";
import {
  calculateBlobGasPrice,
  calculateExcessBlobGas,
  COMMON_MAX_FEE_PER_BLOB_GAS,
  ROLLUP_ADDRESSES,
} from "./web3";

const GAS_PER_BLOB = FORK_BLOB_CONFIGS["dencun"].gasPerBlob;

export type FullBlock = Block & {
  transactions: (Transaction & {
    blobs: (Blob & { storageRefs: BlobDataStorageReference[] })[];
  })[];
};
export class DataGenerator {
  #seedParams: SeedParams;

  constructor(seedParams: SeedParams) {
    this.#seedParams = seedParams;
  }

  generateAddresses(): string[] {
    return Array.from({
      length: this.#seedParams.maxUniqueAddresses,
    }).map(() => faker.finance.ethereumAddress());
  }

  generateDBAddresses(
    addresses: string[],
    txs: Prisma.TransactionCreateManyInput[],
    blocks: Prisma.BlockCreateManyInput[]
  ): Address[] {
    const now = new Date();
    return addresses.map((address) => ({
      address,
      rollup:
        (ROLLUP_ADDRESSES[
          address as keyof typeof ROLLUP_ADDRESSES
        ] as Rollup) ?? null,
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

  generateDBAddress(tx: Transaction): Address[] {
    const now = new Date();
    const addresses = [tx.fromId, tx.toId];

    return addresses.map((address) => ({
      address,
      firstBlockNumberAsReceiver: tx.blockNumber,
      firstBlockNumberAsSender: tx.blockNumber,
      rollup:
        (ROLLUP_ADDRESSES[
          address as keyof typeof ROLLUP_ADDRESSES
        ] as Rollup) ?? null,
      insertedAt: now,
      updatedAt: now,
    }));
  }

  generateBlob(): Blob {
    const now = new Date();
    const commitment = faker.string.hexadecimal({
      length: 96,
    });
    const proof = faker.string.hexadecimal({ length: 96 });
    const versionedHash = `0x01${sha256(commitment).slice(2)}`;
    const size = Number(GAS_PER_BLOB);

    return {
      commitment,
      proof,
      size,
      versionedHash,
      firstBlockNumber: Infinity,
      insertedAt: now,
      updatedAt: now,
    };
  }

  generateBlobDataStorageRef(blob: Blob): BlobDataStorageReference[] {
    return [BlobStorage.GOOGLE, BlobStorage.POSTGRES].map((blobStorage) => ({
      blobHash: blob.versionedHash,
      blobStorage,
      dataReference: blob.versionedHash,
    }));
  }

  generateBlock({
    parentBlock,
    blockInterval,
  }: {
    parentBlock: Pick<
      Block,
      "number" | "slot" | "blobGasUsed" | "excessBlobGas" | "timestamp"
    >;
    blockInterval: number;
  }): Block {
    const now = new Date();

    const number = parentBlock.number + faker.number.int({ min: 1, max: 4 });
    const timestamp = dayjs(parentBlock.timestamp.toISOString()).add(
      blockInterval,
      "second"
    );
    const slot = parentBlock.slot + faker.number.int({ min: 1, max: 5 });
    const txsCount = faker.number.int({
      min: 1,
      max: 6,
    });
    const blobGasUsed = GAS_PER_BLOB * BigInt(txsCount);
    const excessBlobGas = calculateExcessBlobGas(
      BigInt(parentBlock.excessBlobGas.toString()),
      BigInt(
        number - parentBlock.number === 1
          ? parentBlock.blobGasUsed.toString()
          : 0
      )
    ).toString();
    const blobGasPrice = calculateBlobGasPrice(
      BigInt(excessBlobGas)
    ).toString();

    return {
      hash: faker.string.hexadecimal({ length: 64 }),
      number,
      timestamp: timestamp.toDate(),
      slot,
      blobAsCalldataGasUsed: new Prisma.Decimal(0),
      blobGasUsed: new Prisma.Decimal(blobGasUsed.toString()),
      blobGasPrice: new Prisma.Decimal(blobGasPrice),
      excessBlobGas: new Prisma.Decimal(excessBlobGas),
      insertedAt: now,
      updatedAt: now,
    };
  }

  generateBlockTransactions(
    block: Block,
    uniqueAddresses: string[]
  ): Transaction[] {
    const now = new Date();
    const maxBlobs = Number(block.blobGasUsed) / Number(GAS_PER_BLOB);

    const txCount = faker.number.int({
      min: 1,
      max: maxBlobs,
    });

    let remainingBlobs = 6 - txCount;

    return Array.from({
      length: txCount,
    }).map((_, i) => {
      const txHash = faker.string.hexadecimal({ length: 64 });
      const category = faker.helpers.weightedArrayElement(
        this.#seedParams.categoryWeights
      );
      const rollup =
        category === Category.ROLLUP
          ? faker.helpers.weightedArrayElement(this.#seedParams.rollupWeights)
          : null;

      const fromId =
        ROLLUP_ADDRESSES[rollup?.toString() as keyof typeof ROLLUP_ADDRESSES] ??
        faker.helpers.arrayElement(uniqueAddresses);

      let toId = faker.helpers.arrayElement(uniqueAddresses);

      while (toId === fromId) {
        toId = faker.helpers.arrayElement(uniqueAddresses);
      }

      const gasPrice = faker.number
        .bigInt({
          min: 1770074991,
          max: 6323447039,
        })
        .toString();
      const maxFeePerBlobGas = faker.helpers
        .arrayElement(COMMON_MAX_FEE_PER_BLOB_GAS)
        .toString();
      const extraBlobs = faker.number.int({ min: 0, max: remainingBlobs });
      const blobGasUsed = (BigInt(1 + extraBlobs) * GAS_PER_BLOB).toString();

      remainingBlobs -= extraBlobs;

      return {
        hash: txHash,
        index: i,
        fromId,
        toId,
        blockHash: block.hash,
        blockNumber: block.number,
        blockTimestamp: block.timestamp,
        blobAsCalldataGasUsed: new Prisma.Decimal(0),
        blobGasUsed: new Prisma.Decimal(blobGasUsed),
        gasPrice: new Prisma.Decimal(gasPrice),
        maxFeePerBlobGas: new Prisma.Decimal(maxFeePerBlobGas),
        decodedFields: {},
        insertedAt: now,
        updatedAt: now,
      };
    });
  }

  generateTransactionBlobs(tx: Transaction, prevBlobs: Blob[]): Blob[] {
    return Array.from({
      length: Number(tx.blobGasUsed) / Number(GAS_PER_BLOB),
    }).map(() => {
      const isRollupTx = Object.values(ROLLUP_ADDRESSES).includes(tx.fromId);
      const isUnique = isRollupTx
        ? true
        : faker.datatype.boolean({
            probability: this.#seedParams.uniqueBlobsRatio,
          });

      if (isUnique || !prevBlobs.length) {
        return this.generateBlob();
      } else {
        return faker.helpers.arrayElement(prevBlobs);
      }
    });
  }

  generateBlobData(bytesSize: number): Buffer {
    const hex = faker.string.hexadecimal({ length: bytesSize * 2 });

    return Buffer.from(hex.slice(2), "hex");
  }

  generateDBFullBlocks({
    initialBlock,
    uniqueAddresses,
    prevBlobs,
  }: {
    initialBlock?: Block;
    uniqueAddresses: string[];
    prevBlobs: Blob[];
  }): FullBlock[] {
    const totalBlocks = faker.number.int({
      min: this.#seedParams.minBlocksPerDay,
      max: this.#seedParams.maxBlocksPerDay,
    });
    const blockInterval = 86400 / totalBlocks;

    const prevDay = initialBlock
      ? dayjs(initialBlock.timestamp)
      : dayjs().subtract(this.#seedParams.totalDays, "day");
    const nextDay = prevDay.add(1, "day");
    const initialTimestamp = nextDay.startOf("day");

    let parentBlock: Pick<
      Block,
      "number" | "slot" | "excessBlobGas" | "blobGasUsed" | "timestamp"
    > = initialBlock
      ? {
          number: initialBlock.number,
          slot: initialBlock.slot,
          excessBlobGas: initialBlock.excessBlobGas,
          blobGasUsed: initialBlock.blobGasUsed,
          timestamp: initialBlock.timestamp,
        }
      : {
          number: 0,
          slot: 0,
          excessBlobGas: new Prisma.Decimal(0),
          blobGasUsed: new Prisma.Decimal(0),
          timestamp: initialTimestamp.toDate(),
        };

    return Array.from({ length: totalBlocks }).map((_, __) => {
      const block = this.generateBlock({
        parentBlock,
        blockInterval,
      });

      parentBlock = block;

      return {
        ...block,
        transactions: this.generateBlockTransactions(
          block,
          uniqueAddresses
        ).map((tx) => {
          const blobs = this.generateTransactionBlobs(tx, prevBlobs);

          prevBlobs.push(...blobs);

          return {
            ...tx,

            blobs: blobs.map((b) => ({
              ...b,
              storageRefs: this.generateBlobDataStorageRef(b),
            })),
          };
        }),
      };
    });
  }

  generateDBBlockTransactions(
    blocks: Block[],
    uniqueAddresses: string[]
  ): Transaction[][] {
    return blocks.map((block) => {
      return this.generateBlockTransactions(block, uniqueAddresses);
    });
  }

  generateDBTransactionForks(blocks: FullBlock[]): {
    blocks: Block[];
    txs: TransactionFork[];
  } {
    const dbForkTxs: TransactionFork[] = [];
    const forkBlocks: Block[] = [];

    blocks.forEach((b, i) => {
      const isReorg = faker.datatype.boolean({
        probability: this.#seedParams.reorgRatio,
      });
      const parentBlock = blocks[i - 1];

      if (!parentBlock) {
        return;
      }

      const availableSlots = b.slot - parentBlock.slot > 1;

      if (isReorg && availableSlots) {
        const forkBlock = this.generateBlock({
          parentBlock,
          blockInterval: 2,
        });
        forkBlock.number = b.number;
        forkBlock.slot = faker.number.int({
          min: parentBlock.slot + 1,
          max: b.slot - 1,
        });

        forkBlock.timestamp = faker.date.between({
          from: dayjs(parentBlock.timestamp).add(1, "millisecond").toDate(),
          to: dayjs(b.timestamp).subtract(1, "millisecond").toDate(),
        });

        const nextTxs = blocks.slice(i, i + 4).flatMap((b) => b.transactions);
        const forkedTxsCount = faker.number.int({
          min: 1,
          max: 6,
        });

        const forkedTxs = faker.helpers
          .arrayElements(nextTxs, forkedTxsCount)
          .map<TransactionFork>((tx) => ({
            blockHash: forkBlock.hash,
            hash: tx.hash,
            insertedAt: new Date(),
            updatedAt: new Date(),
          }));

        forkBlocks.push(forkBlock);

        dbForkTxs.push(...forkedTxs);
      }
    });

    return { blocks: forkBlocks, txs: dbForkTxs };
  }
}
