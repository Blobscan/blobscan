import { fixtures } from "@blobscan/test";

const currentAt = `${fixtures.systemDate}T19:10:00Z`;

export const CURRENT_DAY_DATA = {
  block: {
    hash: "newBlockHash",
    number: 1009,
    timestamp: "2023-09-01T17:00:00Z",
    slot: 109,
    blobGasUsed: 5500000,
    excessBlobGas: 15000,
    blobGasPrice: 22,
    blobGasAsCalldataUsed: 255000,
    insertedAt: currentAt,
    updatedAt: currentAt,
  },
  txs: [
    {
      hash: "newTxHash001",
      fromId: "address1",
      toId: "address2",
      blockHash: "newBlockHash",
      maxFeePerBlobGas: 1500,
      gasPrice: 99,
      blobGasAsCalldataUsed: 1000,
      insertedAt: currentAt,
      updatedAt: currentAt,
    },
    {
      hash: "newTxHash002",
      fromId: "address5",
      toId: "address2",
      blockHash: "newBlockHash",
      maxFeePerBlobGas: 1500,
      gasPrice: 99,
      blobGasAsCalldataUsed: 1000,
      insertedAt: currentAt,
      updatedAt: currentAt,
    },
  ],
  blobsOnTransactions: [
    {
      blobHash: "blobHash001",
      txHash: "newTxHash001",
      index: 0,
    },
    {
      blobHash: "blobHash002",
      txHash: "newTxHash001",
      index: 1,
    },
    {
      blobHash: "blobHash003",
      txHash: "newTxHash002",
      index: 0,
    },
    {
      blobHash: "blobHash002",
      txHash: "newTxHash002",
      index: 1,
    },
  ],
};
