import { prisma } from "../prisma";

export async function createBlocks() {
  await prisma.block.createMany({
    data: [
      {
        hash: "blockHash003",
        number: 1003,
        timestamp: "2023-08-26T10:00:00Z",
        slot: 103,
        blobGasUsed: 5000000,
        excessBlobGas: 10000,
        blobGasPrice: 20,
        blobAsCalldataGasUsed: 250000,
        insertedAt: "2023-08-26T10:00:00Z",
        updatedAt: "2023-08-26T10:00:00Z",
      },
      {
        hash: "blockHash004",
        number: 1004,
        timestamp: "2023-08-25T12:00:00Z",
        slot: 104,
        blobGasUsed: 5500000,
        excessBlobGas: 15000,
        blobGasPrice: 22,
        blobAsCalldataGasUsed: 255000,
        insertedAt: "2023-08-25T12:00:00Z",
        updatedAt: "2023-08-25T12:00:00Z",
      },
    ],
  });
}

export async function createTransactions() {
  await prisma.transaction.createMany({
    data: [
      {
        hash: "txHash009",
        fromId: "address6",
        toId: "address5",
        blockNumber: 1001,
        maxFeePerBlobGas: 100,
        gasPrice: 10,
        blobAsCalldataGasUsed: 1000,
        insertedAt: "2023-08-24T20:10:00Z",
        updatedAt: "2023-08-24T20:10:00Z",
      },
      {
        hash: "txHash010",
        fromId: "address4",
        toId: "address3",
        blockNumber: 1001,
        maxFeePerBlobGas: 110,
        gasPrice: 11,
        blobAsCalldataGasUsed: 1100,
        insertedAt: "2023-08-28T20:10:00Z",
        updatedAt: "2023-08-28T20:10:00Z",
      },
    ],
  });
}

export async function createBlobs() {
  await createTransactions();

  await prisma.blob.createMany({
    data: [
      {
        versionedHash: "blobHash009",
        commitment: "commitment009",
        size: 500,
        firstBlockNumber: 1001,
        insertedAt: "2023-08-24T20:10:00Z",
        updatedAt: "2023-08-24T20:10:00Z",
      },
      {
        versionedHash: "blobHash010",
        commitment: "commitment010",
        size: 500,
        firstBlockNumber: 1001,
        insertedAt: "2023-08-28T20:10:00Z",
        updatedAt: "2023-08-28T20:10:00Z",
      },
    ],
  });

  await prisma.blobsOnTransactions.createMany({
    data: [
      {
        blobHash: "blobHash009",
        txHash: "txHash009",
        index: 0,
      },
      {
        blobHash: "blobHash010",
        txHash: "txHash010",
        index: 0,
      },
    ],
  });
}
