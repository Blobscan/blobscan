import { calculatePercentage, numberToBigInt, performDiv } from "./number";

export const GAS_PER_BLOB = 131_072; // 2 ** 17
export const BLOB_SIZE = GAS_PER_BLOB;
export const TARGET_BLOB_GAS_PER_BLOCK = 393_216;
export const TARGET_BLOBS_PER_BLOCK = TARGET_BLOB_GAS_PER_BLOCK / GAS_PER_BLOB;
export const BLOB_GAS_LIMIT_PER_BLOCK = 786_432;
export const MAX_BLOBS_PER_BLOCK = BLOB_GAS_LIMIT_PER_BLOCK / GAS_PER_BLOB;

export function calculateBlobGasTarget(blobGasUsed: bigint) {
  const blobsInBlock = performDiv(blobGasUsed, BigInt(GAS_PER_BLOB));

  if (blobsInBlock < TARGET_BLOBS_PER_BLOCK) {
    return calculatePercentage(
      numberToBigInt(blobsInBlock),
      numberToBigInt(TARGET_BLOBS_PER_BLOCK)
    );
  }

  return calculatePercentage(
    numberToBigInt(blobsInBlock - TARGET_BLOBS_PER_BLOCK),
    numberToBigInt(TARGET_BLOBS_PER_BLOCK)
  );
}

// This function shortens an Ethereum address by removing characters from the middle.
export function shortenAddress(address: string, length = 4): string {
  return `${address.slice(0, length)}…${address.slice(-length)}`;
}

export function getChainIdByName(chainName: string): number | undefined {
  switch (chainName) {
    case "mainnet":
      return 1;
    case "holesky":
      return 17000;
    case "sepolia":
      return 11155111;
    case "gnosis":
      return 100;
  }
}
