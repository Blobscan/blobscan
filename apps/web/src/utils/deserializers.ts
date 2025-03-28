import type {
  Blob,
  Block,
  BlockWithExpandedBlobsAndTransactions,
  TransactionWithExpandedBlockAndBlob,
  Transaction,
  TransactionWithExpandedBlock,
  OverallStats,
} from "~/types";
import { normalizeTimestamp } from "./date";

export type DeserializedBlob = Blob;

export type DeserializedBlock = ReturnType<typeof deserializeBlock>;

export type DeserializedFullBlock = ReturnType<typeof deserializeFullBlock>;

export type DeserializedTransaction = ReturnType<typeof deserializeTransaction>;

export type DeserializedFullTransaction = ReturnType<
  typeof deserializeFullTransaction
>;

function deserializeBlockGasFields(
  block: TransactionWithExpandedBlock["block"]
) {
  const { blobAsCalldataGasUsed, blobGasPrice, blobGasUsed, excessBlobGas } =
    block;

  return {
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobGasPrice: BigInt(blobGasPrice),
    blobGasUsed: BigInt(blobGasUsed),
    excessBlobGas: BigInt(excessBlobGas),
  };
}

function deserializeTransactionCommonFields(
  transaction: Pick<
    Transaction,
    | "maxFeePerBlobGas"
    | "blobGasMaxFee"
    | "blobGasUsed"
    | "blobAsCalldataGasUsed"
    | "blobAsCalldataGasFee"
  >
) {
  const {
    maxFeePerBlobGas,
    blobGasMaxFee,
    blobGasUsed,
    blobAsCalldataGasUsed,
    blobAsCalldataGasFee,
  } = transaction;

  return {
    maxFeePerBlobGas: BigInt(maxFeePerBlobGas),
    blobGasMaxFee: BigInt(blobGasMaxFee),
    blobGasUsed: BigInt(blobGasUsed),
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobAsCalldataGasFee: BigInt(blobAsCalldataGasFee),
  };
}

export function deserializeTransaction(transaction: Transaction) {
  return {
    ...transaction,
    ...deserializeTransactionCommonFields(transaction),
    blockTimestamp: normalizeTimestamp(transaction.blockTimestamp),
  };
}

export function deserializeTransactionWithBlock(
  transactionWithBlock: TransactionWithExpandedBlock
) {
  const { block, blobGasBaseFee, ...transaction } = transactionWithBlock;

  return {
    ...transactionWithBlock,
    ...transaction,
    ...deserializeTransaction(transaction),
    blobGasBaseFee: BigInt(blobGasBaseFee),
    block: {
      ...block,
      ...deserializeBlockGasFields(block),
    },
  };
}

export function deserializeFullTransaction(
  fullTransaction: TransactionWithExpandedBlockAndBlob
) {
  const { block, blobGasBaseFee, ...transaction } = fullTransaction;

  return {
    ...transaction,
    ...deserializeTransactionCommonFields(transaction),
    blockTimestamp: normalizeTimestamp(transaction.blockTimestamp),
    blobGasBaseFee: BigInt(blobGasBaseFee),
    block: {
      ...block,
      ...deserializeBlockGasFields(block),
    },
  };
}

export function deserializeBlock(block: Block) {
  return {
    ...block,
    timestamp: normalizeTimestamp(block.timestamp),
    ...deserializeBlockGasFields(block),
  };
}

export function deserializeFullBlock(
  fullBlock: BlockWithExpandedBlobsAndTransactions
) {
  const { transactions, ...block } = fullBlock;

  return {
    ...block,
    ...deserializeBlockGasFields(block),
    timestamp: normalizeTimestamp(block.timestamp),
    transactions: transactions.map((tx) => ({
      ...tx,
      ...deserializeTransactionCommonFields(tx),
      blobGasBaseFee: BigInt(tx.blobGasBaseFee),
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
