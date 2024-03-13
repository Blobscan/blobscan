import type {
  Blob,
  Block,
  Transaction,
  WithoutTimestampFields,
} from "@blobscan/db";
import { Prisma } from "@blobscan/db";

import type { IndexDataInput } from "./indexData.schema";

const MIN_BLOB_BASE_FEE = BigInt(1);
const BLOB_BASE_FEE_UPDATE_FRACTION = BigInt(3_338_477);

export const GAS_PER_BLOB = 2 ** 17; // 131_072

function bigIntToDecimal(bigint: bigint) {
  return new Prisma.Decimal(bigint.toString());
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
}: IndexDataInput): WithoutTimestampFields<Transaction>[] {
  return transactions.map<WithoutTimestampFields<Transaction>>(
    ({ from, gasPrice, hash, maxFeePerBlobGas, to }) => {
      const txBlobs = blobs.filter((b) => b.txHash === hash);

      if (txBlobs.length === 0) {
        throw new Error(`Blob for transaction ${hash} not found`);
      }

      const blobGasAsCalldataUsed = txBlobs.reduce(
        (acc, b) => acc + getEIP2028CalldataGas(b.data),
        BigInt(0)
      );

      const blobGasPrice = calculateBlobGasPrice(block.excessBlobGas);

      return {
        blockHash: block.hash,
        hash,
        fromId: from,
        toId: to,
        gasPrice: bigIntToDecimal(gasPrice),
        blobGasPrice: bigIntToDecimal(blobGasPrice),
        maxFeePerBlobGas: bigIntToDecimal(maxFeePerBlobGas),
        blobGasAsCalldataUsed: bigIntToDecimal(blobGasAsCalldataUsed),
      };
    }
  );
}

export function createDBBlock(
  {
    block: { blobGasUsed, excessBlobGas, hash, number, slot, timestamp },
  }: IndexDataInput,
  dbTxs: Pick<Transaction, "blobGasAsCalldataUsed">[]
): WithoutTimestampFields<Block> {
  const blobGasAsCalldataUsed = dbTxs.reduce(
    (acc, tx) => acc.add(tx.blobGasAsCalldataUsed),
    new Prisma.Decimal(0)
  );

  const blobGasPrice = calculateBlobGasPrice(excessBlobGas);
  return {
    number,
    hash,
    timestamp: new Date(timestamp * 1000),
    slot,
    blobGasUsed: bigIntToDecimal(blobGasUsed),
    blobGasPrice: bigIntToDecimal(blobGasPrice),
    excessBlobGas: bigIntToDecimal(excessBlobGas),
    blobGasAsCalldataUsed,
  };
}

export function createDBBlobs({
  blobs,
  block,
}: IndexDataInput): WithoutTimestampFields<Blob>[] {
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
