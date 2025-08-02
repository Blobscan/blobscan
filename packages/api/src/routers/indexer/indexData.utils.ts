import type {
  Address,
  Blob,
  BlobsOnTransactions,
  Block,
  Transaction,
  WithoutTimestampFields,
} from "@blobscan/db";
import { Prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";
import { getRollupByAddress } from "@blobscan/rollups";

import type { IndexDataFormattedInput } from "./indexData";

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

export function calculateBlobBytesSize(blob: string) {
  // Remove 0x prefix
  const blobLength = blob.length - 2;

  return blobLength / 2;
}

export function calculateBlobUsageSize(blob: string) {
  let paddingBytes = 0;
  let i = blob.length - 1;

  while (i > 1 && blob[i] === "0" && blob[i - 1] === "0") {
    paddingBytes += 1;
    i -= 2;
  }

  const blobBytesSize = calculateBlobBytesSize(blob);

  return blobBytesSize - paddingBytes;
}

export function calculateBlobGasPrice(
  slot: number,
  excessBlobGas: bigint
): bigint {
  const { minBlobBaseFee, blobBaseFeeUpdateFraction } =
    getNetworkBlobConfigBySlot(env.CHAIN_ID, slot);

  return BigInt(
    fakeExponential(minBlobBaseFee, excessBlobGas, blobBaseFeeUpdateFraction)
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

      const ethereumConfig = getNetworkBlobConfigBySlot(
        env.CHAIN_ID,
        block.slot
      );
      const blobGasPrice = calculateBlobGasPrice(
        block.slot,
        block.excessBlobGas
      );

      return {
        blockHash: block.hash,
        blockNumber: block.number,
        blockTimestamp: timestampToDate(block.timestamp),
        hash,
        fromId: from,
        toId: to,
        index,
        gasPrice: bigIntToDecimal(gasPrice),
        blobGasUsed: bigIntToDecimal(
          BigInt(txBlobs.length) * ethereumConfig.gasPerBlob
        ),
        blobGasPrice: bigIntToDecimal(blobGasPrice),
        maxFeePerBlobGas: bigIntToDecimal(maxFeePerBlobGas),
        blobAsCalldataGasUsed: bigIntToDecimal(blobGasAsCalldataUsed),
        decodedFields: null,
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
  const blobGasPrice = calculateBlobGasPrice(slot, excessBlobGas);

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
        size: calculateBlobBytesSize(blob.data),
        usageSize: calculateBlobUsageSize(blob.data),
        firstBlockNumber: block.number,
      };
    }
  );
}

export function createDBBlobsOnTransactions({
  block,
  transactions,
  blobs,
}: IndexDataFormattedInput): BlobsOnTransactions[] {
  return blobs.map(({ versionedHash, txHash, index }) => {
    const tx = transactions.find((t) => t.hash === txHash);

    if (!tx) {
      throw new Error(`Transaction ${txHash} not found`);
    }

    return {
      blobHash: versionedHash,
      blockHash: block.hash,
      blockNumber: block.number,
      blockTimestamp: timestampToDate(block.timestamp),
      txHash: txHash,
      txIndex: tx.index,
      index,
    };
  });
}

export function createDBAddresses({
  transactions,
}: IndexDataFormattedInput): WithoutTimestampFields<Address>[] {
  const addresses = transactions.reduce<
    Record<string, WithoutTimestampFields<Address>>
  >((addressToEntity, { from, to, blockNumber }) => {
    const fromEntity: WithoutTimestampFields<Address> = addressToEntity[
      from
    ] ?? {
      address: from,
      firstBlockNumberAsReceiver: null,
      firstBlockNumberAsSender: null,
      rollup: getRollupByAddress(from, env.CHAIN_ID),
    };
    const toEntity: WithoutTimestampFields<Address> = addressToEntity[to] ?? {
      address: to,
      firstBlockNumberAsReceiver: null,
      firstBlockNumberAsSender: null,
      rollup: getRollupByAddress(to, env.CHAIN_ID),
    };

    fromEntity.firstBlockNumberAsSender = fromEntity.firstBlockNumberAsSender
      ? Math.min(fromEntity.firstBlockNumberAsSender, blockNumber)
      : blockNumber;
    toEntity.firstBlockNumberAsReceiver = toEntity.firstBlockNumberAsReceiver
      ? Math.min(toEntity.firstBlockNumberAsReceiver, blockNumber)
      : blockNumber;

    return {
      ...addressToEntity,
      [from]: fromEntity,
      [to]: toEntity,
    };
  }, {});

  return Object.values(addresses);
}
