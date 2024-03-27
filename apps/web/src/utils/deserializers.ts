import type {
  AllOverallStats,
  Blob,
  Block,
  FullBlock,
  FullTransaction,
  Transaction,
  TransactionWithBlock,
} from "~/types";
import { normalizeTimestamp } from "./date";

export type DeserializedBlob = Blob;

export type DeserializedBlock = ReturnType<typeof deserializeBlock>;

export type DeserializedFullBlock = ReturnType<typeof deserializeFullBlock>;

export type DeserializedTransaction = ReturnType<typeof deserializeTransaction>;

export type DeserializedFullTransaction = ReturnType<
  typeof deserializeFullTransaction
>;

function getDeserializedBlockFields(block: TransactionWithBlock["block"]) {
  const {
    blobAsCalldataGasUsed,
    blobGasPrice,
    blobGasUsed,
    excessBlobGas,
    timestamp,
  } = block;

  return {
    blobAsCalldataGasUsed: BigInt(blobAsCalldataGasUsed),
    blobGasPrice: BigInt(blobGasPrice),
    blobGasUsed: BigInt(blobGasUsed),
    excessBlobGas: BigInt(excessBlobGas),
    timestamp: normalizeTimestamp(timestamp),
  };
}

function getDeserializedTransactionFields(
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
  const normalizedTxFields = getDeserializedTransactionFields(transaction);

  return {
    ...transaction,
    ...normalizedTxFields,
  };
}

export function deserializeTransactionWithBlock(
  transactionWithBlock: TransactionWithBlock
) {
  const { block, blobGasBaseFee, ...transaction } = transactionWithBlock;
  const normalizedTxFields = deserializeTransaction(transaction);
  const normalizedBlockFields = getDeserializedBlockFields(block);

  return {
    ...transactionWithBlock,
    ...normalizedTxFields,
    blobGasBaseFee: BigInt(blobGasBaseFee),
    block: {
      ...block,
      ...normalizedBlockFields,
    },
  };
}

export function deserializeFullTransaction(fullTransaction: FullTransaction) {
  const { block, blobGasBaseFee, ...transaction } = fullTransaction;

  return {
    ...transaction,
    ...getDeserializedTransactionFields(transaction),
    blobGasBaseFee: BigInt(blobGasBaseFee),
    block: {
      ...block,
      ...getDeserializedBlockFields(block),
    },
  };
}

export function deserializeBlock(block: Block) {
  return {
    ...block,
    ...getDeserializedBlockFields(block),
  };
}

export function deserializeFullBlock(fullBlock: FullBlock) {
  const { transactions, ...block } = fullBlock;

  return {
    ...block,
    ...getDeserializedBlockFields(block),
    transactions: transactions.map((tx) => ({
      ...tx,
      ...getDeserializedTransactionFields(tx),
      blobGasBaseFee: BigInt(tx.blobGasBaseFee),
    })),
  };
}

export function deserializeBlockOverallStats(
  blockOverallStats: AllOverallStats["block"]
) {
  const {
    totalBlobAsCalldataFee,
    totalBlobFee,
    totalBlobGasUsed,
    totalBlobAsCalldataGasUsed,
  } = blockOverallStats;

  return {
    ...blockOverallStats,
    totalBlobAsCalldataFee: BigInt(totalBlobAsCalldataFee),
    totalBlobFee: BigInt(totalBlobFee),
    totalBlobGasUsed: BigInt(totalBlobGasUsed),
    totalBlobAsCalldataGasUsed: BigInt(totalBlobAsCalldataGasUsed),
  };
}
