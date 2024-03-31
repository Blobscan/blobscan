import type {
  Blob,
  Block,
  Transaction,
  WithoutTimestampFields,
} from "@blobscan/db";
import { Prisma, Rollup } from "@blobscan/db";

import { env } from "../../env";
import type { IndexDataInput } from "./indexData";

const MIN_BLOB_BASE_FEE = BigInt(1);
const BLOB_BASE_FEE_UPDATE_FRACTION = BigInt(3_338_477);

const ROLLUPS_ADDRESSES: { [chainId: string]: Record<string, Rollup> } = {
  // Mainnet
  "1": {
    "0xc1b634853cb333d3ad8663715b08f41a3aec47cc": Rollup.ARBITRUM,
    "0x5050f69a9786f081509234f1a7f4684b5e5b76c9": Rollup.BASE,
    "0xa9268341831efa4937537bc3e9eb36dbece83c7e": Rollup.LINEA,
    "0x6887246668a3b87f54deb3b94ba47a6f63f32985": Rollup.OPTIMISM,
    "0xc70ae19b5feaa5c19f576e621d2bad9771864fe2": Rollup.PARADEX,
    "0x2c169dfe5fbba12957bdd0ba47d9cedbfe260ca7": Rollup.STARKNET,
    "0x0d3250c3d5facb74ac15834096397a3ef790ec99": Rollup.ZKSYNC,
    "0x99199a22125034c808ff20f377d91187e8050f2e": Rollup.MODE,
    "0x625726c858dbf78c0125436c943bf4b4be9d9033": Rollup.ZORA,
  },
  // Holesky
  "17000": {},
  // Sepolia
  "11155111": {
    "0xb2248390842d3c4acf1d8a893954afc0eac586e5": Rollup.ARBITRUM,
    "0x6cdebe940bc0f26850285caca097c11c33103e47": Rollup.BASE,
    "0x47c63d1e391fcb3dcdc40c4d7fa58adb172f8c38": Rollup.LINEA,
    "0x8f23bb38f531600e5d8fddaaec41f13fab46e98c": Rollup.OPTIMISM,
    "0x5b98b836969a60fec50fa925905dd1d382a7db43": Rollup.STARKNET,
    "0x4e6bd53883107b063c502ddd49f9600dc51b3ddc": Rollup.MODE,
    "0x3cd868e221a3be64b161d596a7482257a99d857f": Rollup.ZORA,
  },
  // Gnosis
  "100": {},
};

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

export function resolveRollup(from: string): Rollup | null {
  const addressMapping = ROLLUPS_ADDRESSES[env.CHAIN_ID];

  if (!addressMapping) {
    return null;
  }

  return addressMapping[from.toLowerCase()] || null;
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
        throw new Error(`Blobs for transaction ${hash} not found`);
      }

      const blobGasAsCalldataUsed = txBlobs.reduce(
        (acc, b) => acc + getEIP2028CalldataGas(b.data),
        BigInt(0)
      );

      const blobGasPrice = calculateBlobGasPrice(block.excessBlobGas);
      const rollup = resolveRollup(from);

      return {
        blockHash: block.hash,
        hash,
        fromId: from,
        toId: to,
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
  }: IndexDataInput,
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
    timestamp: new Date(timestamp * 1000),
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
