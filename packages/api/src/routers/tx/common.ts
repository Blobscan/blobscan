import { Prisma } from "@blobscan/db";

const transactionSelect = Prisma.validator<Prisma.TransactionSelect>()({
  hash: true,
  fromId: true,
  toId: true,
  blockNumber: true,
  blobAsCalldataGasUsed: true,
  gasPrice: true,
  maxFeePerBlobGas: true,
});

// TODO: Find a way to infer this
type FullTransaction = {
  block: {
    timestamp: Date;
    excessBlobGas: Prisma.Decimal;
    blobGasPrice: Prisma.Decimal;
  };
  hash: string;
  fromId: string;
  toId: string;
  blockNumber: number;
  maxFeePerBlobGas: Prisma.Decimal;
  gasPrice: Prisma.Decimal;
  blobAsCalldataGasUsed: Prisma.Decimal;
  blobs: {
    blobHash: string;
    index: number;
    blob: {
      commitment: string;
      size: number;
    };
  }[];
};

export const fullTransactionSelect =
  Prisma.validator<Prisma.TransactionSelect>()({
    ...transactionSelect,
    block: {
      select: {
        excessBlobGas: true,
        timestamp: true,
        blobGasPrice: true,
      },
    },
    blobs: {
      select: {
        blobHash: true,
        index: true,
        blob: {
          select: {
            commitment: true,
            size: true,
          },
        },
      },
    },
  });

export function formatFullTransaction(tx: FullTransaction) {
  return {
    ...tx,
    blobAsCalldataGasUsed: tx.blobAsCalldataGasUsed.toFixed(),
    gasPrice: tx.gasPrice.toFixed(),
    maxFeePerBlobGas: tx.maxFeePerBlobGas.toFixed(),
    block: {
      ...tx.block,
      blobGasPrice: tx.block.blobGasPrice.toFixed(),
      excessBlobGas: tx.block.excessBlobGas.toFixed(),
    },
  };
}
