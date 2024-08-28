import type {
  Blob,
  BlobsOnTransactions,
  Block,
  Transaction,
  WithoutTimestampFields,
} from "@blobscan/db";
import { Prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { resolveRollup } from "@blobscan/rollups";

import type { IndexDataFormattedInput } from "./indexData";

const MIN_BLOB_BASE_FEE = BigInt(1);
const BLOB_BASE_FEE_UPDATE_FRACTION = BigInt(3_338_477);

function bigIntToDecimal(bigint: bigint) {
  return new Prisma.Decimal(bigint.toString());
}

function timestampToDate(timestamp: number) {
  return new Date(timestamp * 1000);
}

function fakeExponential(
  factor: bigint,
  numerator: bigint,
  denominator: bigint
): bigint {
  let i = BigInt(1);
  let output = BigInt(0);
  let numerator_accumulator = factor * denominator;

  while (numerator_accumulator > 0) {
    output += numerator_accumulator;
    numerator_accumulator =
      (numerator_accumulator * numerator) / (denominator * i);

    i++;
  }

  return output / denominator;
}

export function getEIP2028CalldataGas(hexData: string) {
  const bytes = Buffer.from(hexData.slice(2), "hex");
  let gasCost = BigInt(0);

  for (const byte of bytes.entries()) {
    if (byte[1] === 0) {
      gasCost += BigInt(4);
    } else {
      gasCost += BigInt(16);
    }
  }

  return gasCost;
}

export function calculateBlobSize(blob: string): number {
  return blob.slice(2).length / 2;
}

export function calculateBlobGasPrice(excessBlobGas: bigint): bigint {
  return BigInt(
    fakeExponential(
      MIN_BLOB_BASE_FEE,
      excessBlobGas,
      BLOB_BASE_FEE_UPDATE_FRACTION
    )
  );
}

export function createDBTransactions({
  blobs,
  block,
  transactions,
}: IndexDataFormattedInput): WithoutTimestampFields<Transaction>[] {
  return transactions.map<WithoutTimestampFields<Transaction>>(
    ({ from, gasPrice, hash, maxFeePerBlobGas, to, index }) => {
      const txBlobs = blobs.filter((b) => b.txHash === hash);

      if (txBlobs.length === 0) {
        throw new Error(`Blobs for transaction ${hash} not found`);
      }

      const blobGasAsCalldataUsed = txBlobs.reduce(
        (acc, b) => acc + getEIP2028CalldataGas(b.data),
        BigInt(0)
      );

      const blobGasPrice = calculateBlobGasPrice(block.excessBlobGas);
      const rollup = resolveRollup(to, env.CHAIN_ID);

      return {
        blockHash: block.hash,
        blockNumber: block.number,
        blockTimestamp: timestampToDate(block.timestamp),
        hash,
        fromId: from,
        toId: to,
        index,
        gasPrice: bigIntToDecimal(gasPrice),
        blobGasPrice: bigIntToDecimal(blobGasPrice),
        maxFeePerBlobGas: bigIntToDecimal(maxFeePerBlobGas),
        blobAsCalldataGasUsed: bigIntToDecimal(blobGasAsCalldataUsed),
        rollup,
      };
    }
  );
}

export function createDBBlock(
  {
    block: { blobGasUsed, excessBlobGas, hash, number, slot, timestamp },
  }: IndexDataFormattedInput,
  dbTxs: Pick<Transaction, "blobAsCalldataGasUsed">[]
): WithoutTimestampFields<Block> {
  const blobAsCalldataGasUsed = dbTxs.reduce(
    (acc, tx) => acc.add(tx.blobAsCalldataGasUsed),
    new Prisma.Decimal(0)
  );

  const blobGasPrice = calculateBlobGasPrice(excessBlobGas);
  return {
    number,
    hash,
    timestamp: timestampToDate(timestamp),
    slot,
    blobGasUsed: bigIntToDecimal(blobGasUsed),
    blobGasPrice: bigIntToDecimal(blobGasPrice),
    excessBlobGas: bigIntToDecimal(excessBlobGas),
    blobAsCalldataGasUsed,
  };
}

export function createDBBlobs({
  blobs,
  block,
}: IndexDataFormattedInput): WithoutTimestampFields<Blob>[] {
  const uniqueBlobVersionedHashes = Array.from(
    new Set(blobs.map((b) => b.versionedHash))
  );

  return uniqueBlobVersionedHashes.map<WithoutTimestampFields<Blob>>(
    (versionedHash) => {
      const blob = blobs.find((b) => b.versionedHash === versionedHash);

      // Type safety check to make TS happy
      if (!blob) {
        throw new Error(`Blob ${versionedHash} not found`);
      }

      return {
        versionedHash: blob.versionedHash,
        commitment: blob.commitment,
        proof: blob.proof,
        size: calculateBlobSize(blob.data),
        firstBlockNumber: block.number,
      };
    }
  );
}

export function createDBBlobsOnTransactions({
  block,
  blobs,
}: IndexDataFormattedInput): BlobsOnTransactions[] {
  return blobs.map(({ versionedHash, txHash, index }) => ({
    blobHash: versionedHash,
    blockHash: block.hash,
    blockNumber: block.number,
    blockTimestamp: timestampToDate(block.timestamp),
    txHash: txHash,
    index,
  }));
}
