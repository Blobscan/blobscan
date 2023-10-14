import type {
  Blob,
  Block,
  Transaction,
  WithoutTimestampFields,
} from "@blobscan/db";

import type { IndexDataInput } from "./indexData.schema";

const MIN_BLOB_GASPRICE = 1;
const BLOB_GASPRICE_UPDATE_FRACTION = 3_338_477;

export const GAS_PER_BLOB = 2 ** 17; // 131_072

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

export function getEIP2028CalldataGas(hexData: string): number {
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

export function calculateBlobSize(blob: string): number {
  return blob.slice(2).length / 2;
}

export function calculateBlobGasPrice(excessDataGas: number): bigint {
  return BigInt(
    fakeExponential(
      BigInt(MIN_BLOB_GASPRICE),
      BigInt(excessDataGas),
      BigInt(BLOB_GASPRICE_UPDATE_FRACTION)
    )
  );
}

export function createDBTransactions({
  blobs,
  block,
  transactions,
}: IndexDataInput): WithoutTimestampFields<Transaction>[] {
  return transactions.map<WithoutTimestampFields<Transaction>>(
    ({ blockNumber, from, gasPrice, hash, maxFeePerBlobGas, to }) => {
      const txBlob: IndexDataInput["blobs"][0] | undefined = blobs.find(
        (b) => b.txHash === hash
      );

      if (!txBlob) {
        throw new Error(`Blob for transaction ${hash} not found`);
      }

      return {
        blockNumber,
        hash,
        fromId: from,
        toId: to,
        gasPrice,
        blobGasPrice: calculateBlobGasPrice(block.excessBlobGas),
        maxFeePerBlobGas,
        blobAsCalldataGasUsed: getEIP2028CalldataGas(txBlob.data),
      };
    }
  );
}

export function createDBBlock(
  {
    block: { blobGasUsed, excessBlobGas, hash, number, slot, timestamp },
  }: IndexDataInput,
  dbTxs: Pick<Transaction, "blobAsCalldataGasUsed">[]
): WithoutTimestampFields<Block> {
  const blobAsCalldataGasUsed = dbTxs.reduce(
    (acc, tx) => acc + tx.blobAsCalldataGasUsed,
    0
  );

  return {
    number,
    hash,
    timestamp: new Date(timestamp * 1000),
    slot,
    blobGasUsed,
    blobGasPrice: calculateBlobGasPrice(excessBlobGas),
    excessBlobGas,
    blobAsCalldataGasUsed,
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
        size: calculateBlobSize(blob.data),
        firstBlockNumber: block.number,
      };
    }
  );
}
