export type SeedParams = {
  totalDays: number;
  minBlocksPerDay: number;
  maxBlocksPerDay: number;
  maxBlobsPerBlock: number;
  maxBlobsPerTx: number;
  maxUniqueBlobs: number;
  maxUniqueAddresses: number;
  maxBlobBytesSize: number;

  minGasPrice: bigint;
  maxGasPrice: bigint;
  minBlobGasPrice: bigint;
  maxBlobGasPrice: bigint;
  maxFeePerBlobGas: bigint;

  gasPerBlob: number;
};

export const seedParams: SeedParams = {
  totalDays: 45,
  minBlocksPerDay: 300,
  maxBlocksPerDay: 500,

  maxBlobsPerBlock: 6,
  maxBlobsPerTx: 3,

  maxUniqueBlobs: 100,
  maxUniqueAddresses: 1000,

  maxBlobBytesSize: 1024,

  minGasPrice: BigInt(30000000000),
  maxGasPrice: BigInt(100000000000),
  minBlobGasPrice: BigInt(30000000000),
  maxBlobGasPrice: BigInt(100000000000),
  maxFeePerBlobGas: BigInt(1000),

  gasPerBlob: 2 ** 17, // 131_072
};
