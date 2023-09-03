export const INDEXER_DATA = {
  block: {
    number: 1003,
    hash: "blockHash003",
    timestamp: 1630257174,
    slot: 103,
    blobGasUsed: "10000",
    excessBlobGas: "5000",
  },
  transactions: [
    {
      hash: "txHash009",
      from: "address4",
      to: "address8",
      blockNumber: 1003,
      gasPrice: "10000",
      maxFeePerBlobGas: "1800",
    },
    {
      hash: "txHash010",
      from: "address7",
      to: "address2",
      blockNumber: 1003,
      gasPrice: "3000000",
      maxFeePerBlobGas: "20000",
    },
  ],
  blobs: [
    {
      versionedHash: "blobHash003",
      commitment: "commitment003",
      data: "1234abcdefg123456789ab",
      txHash: "txHash003",
      index: 0,
    },
    {
      versionedHash: "blobHash009",
      commitment: "commitment009",
      data: "0x34567890abcdef1234567890abcdef",
      txHash: "txHash009",
      index: 0,
    },
    {
      versionedHash: "blobHash010",
      commitment: "commitment010",
      data: "0x34567890abcdef1234567890abcdef1234567890abcdef",
      txHash: "txHash010",
      index: 0,
    },
  ],
};
