export const INPUT = {
  block: {
    number: 2010,
    hash: "blockHash2010",
    timestamp: 1693576221,
    slot: 130,
    blobGasUsed: "10000",
    excessBlobGas: "5000",
  },
  transactions: [
    {
      hash: "txHash999",
      from: "address9",
      to: "address10",
      blockNumber: 2010,
      gasPrice: "10000",
      maxFeePerBlobGas: "1800",
    },
    {
      hash: "txHash1000",
      from: "address7",
      to: "address2",
      blockNumber: 2010,
      gasPrice: "3000000",
      maxFeePerBlobGas: "20000",
    },
  ],
  blobs: [
    {
      versionedHash: "blobHash999",
      commitment: "commitment999",
      proof: "newProof999",
      data: "0x1234abcdeff123456789ab",
      txHash: "txHash999",
      index: 0,
    },
    {
      versionedHash: "blobHash1000",
      commitment: "commitment1000",
      proof: "newProof1000",
      data: "0x34567890abcdef1234567890abcdef",
      txHash: "txHash1000",
      index: 0,
    },
    {
      versionedHash: "blobHash1001",
      commitment: "commitment1001",
      proof: "newProof1001",
      data: "0x34567890abcdef1234567890abcdef1234567890abcdef",
      txHash: "txHash1000",
      index: 1,
    },
  ],
};

export const INPUT_WITH_DUPLICATED_BLOBS = {
  block: {
    number: 9999,
    hash: "blockHash9999",
    timestamp: 1694586221,
    slot: 170,
    blobGasUsed: "10000",
    excessBlobGas: "5000",
  },
  transactions: [
    {
      hash: "txHash2002",
      from: "address9",
      to: "address10",
      blockNumber: 9999,
      gasPrice: "10000",
      maxFeePerBlobGas: "1800",
    },
  ],
  blobs: [
    {
      versionedHash: "blobHash2000",
      commitment: "commitment2000",
      proof: "newProof2000",
      data: "0x1234abcdeff123456789ab34223a4b2c2ed",
      txHash: "txHash2002",
      index: 0,
    },
    {
      versionedHash: "blobHash2000",
      commitment: "commitment2000",
      proof: "newProof2000",
      data: "0x1234abcdeff123456789ab34223a4b2c2ed",
      txHash: "txHash2002",
      index: 1,
    },
    {
      versionedHash: "blobHash2000",
      commitment: "commitment2000",
      proof: "newProof2000",
      data: "0x1234abcdeff123456789ab34223a4b2c2ed",
      txHash: "txHash2002",
      index: 2,
    },
  ],
};
