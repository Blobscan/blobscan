import type {
  Blob,
  Block,
  BlockWithExpandedBlobsAndTransactions,
  TransactionWithExpandedBlockAndBlob,
  Transaction,
  TransactionWithExpandedBlock,
  OverallStats,
  BlockWithExpandedTransactions,
} from "~/types";
import { normalizeTimestamp } from "./date";

export type DeserializedBlob = Blob;

export type DeserializedBlock = ReturnType<typeof deserializeBlock>;

export type DeserializedFullBlock = ReturnType<typeof deserializeFullBlock>;

export type DeserializedTransaction = ReturnType<typeof deserializeTransaction>;

export type DeserializedFullTransaction = ReturnType<
  typeof deserializeFullTransaction
>;

function deserializeExpandedBlock(
  block: TransactionWithExpandedBlock["block"]
) {
  const {
    blobAsCalldataGasUsed,
    blobGasPrice,
    blobGasUsed,
    excessBlobGas,
    slot,
  } = block;

  return {
    slot,
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobGasPrice: BigInt(blobGasPrice),
    blobGasUsed: BigInt(blobGasUsed),
    excessBlobGas: BigInt(excessBlobGas),
  };
}

function deserializeExpandedTransaction({
  maxFeePerBlobGas,
  blobGasBaseFee,
  blobGasMaxFee,
  blobGasUsed,
  blobAsCalldataGasUsed,
  blobAsCalldataGasFee,
  ...restTransaction
}: BlockWithExpandedTransactions["transactions"][number]) {
  return {
    ...restTransaction,
    maxFeePerBlobGas: BigInt(maxFeePerBlobGas),
    blobGasBaseFee: BigInt(blobGasBaseFee),
    blobGasMaxFee: BigInt(blobGasMaxFee),
    blobGasUsed: BigInt(blobGasUsed),
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobAsCalldataGasFee: BigInt(blobAsCalldataGasFee),
  };
}

export function deserializeTransaction({
  blockTimestamp,
  blobAsCalldataGasFee,
  blobAsCalldataGasUsed,
  blobGasBaseFee,
  blobGasMaxFee,
  blobGasUsed,
  maxFeePerBlobGas,
  block,
  ...restTransaction
}: Transaction) {
  return {
    ...restTransaction,
    blockTimestamp: normalizeTimestamp(blockTimestamp),
    blobAsCalldataGasFee: BigInt(blobAsCalldataGasFee),
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobGasBaseFee: BigInt(blobGasBaseFee),
    blobGasMaxFee: BigInt(blobGasMaxFee),
    blobGasUsed: BigInt(blobGasUsed),
    maxFeePerBlobGas: BigInt(maxFeePerBlobGas),
    block: {
      blobGasPrice: BigInt(block.blobGasPrice),
    },
  };
}

export function deserializeTransactionWithBlock(
  transactionWithBlock: TransactionWithExpandedBlock
) {
  const { block, ...transaction } = transactionWithBlock;

  return {
    ...transactionWithBlock,
    ...transaction,
    ...deserializeTransaction(transactionWithBlock),
    block: deserializeExpandedBlock(block),
  };
}

export function deserializeFullTransaction(
  fullTransaction: TransactionWithExpandedBlockAndBlob
) {
  return {
    ...deserializeTransaction(fullTransaction),
    blobs: fullTransaction.blobs.map((blob) => blob),
    block: deserializeExpandedBlock(fullTransaction.block),
  };
}

export function deserializeBlock({
  blobAsCalldataGasUsed,
  blobGasPrice,
  blobGasUsed,
  excessBlobGas,
  timestamp,
  ...restBlock
}: Block) {
  return {
    ...restBlock,
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobGasPrice: BigInt(blobGasPrice),
    blobGasUsed: BigInt(blobGasUsed),
    excessBlobGas: BigInt(excessBlobGas),
    timestamp: normalizeTimestamp(timestamp),
  };
}

export function deserializeFullBlock(
  fullBlock: BlockWithExpandedBlobsAndTransactions
) {
  return {
    ...deserializeBlock(fullBlock),
    transactions: fullBlock.transactions.map((tx) => ({
      ...deserializeExpandedTransaction(tx),
      blobs: tx.blobs.map((blob) => blob),
    })),
  };
}

export function deserializeOverallStats(overallStats: OverallStats) {
  const {
    avgMaxBlobGasFee,
    avgBlobGasPrice,
    totalBlobs,
    totalTransactions,
    totalBlobSize,
    totalUniqueBlobs,
    totalBlocks,
    totalBlobGasUsed,
    totalBlobFee,
    totalBlobAsCalldataFee,
    totalBlobAsCalldataGasUsed,
    totalUniqueSenders,
    totalUniqueReceivers,
  } = overallStats;

  return {
    avgMaxBlobGasFee,
    avgBlobGasPrice,
    totalBlobs,
    totalTransactions,
    totalBlocks,
    totalUniqueSenders,
    totalUniqueReceivers,
    totalUniqueBlobs: totalUniqueBlobs,
    totalBlobSize: BigInt(totalBlobSize),
    totalBlobGasUsed: BigInt(totalBlobGasUsed),
    totalBlobFee: BigInt(totalBlobFee),
    totalBlobAsCalldataFee: BigInt(totalBlobAsCalldataFee),
    totalBlobAsCalldataGasUsed: BigInt(totalBlobAsCalldataGasUsed),
  };
}
