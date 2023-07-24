export type SeedParams = {
  totalDays: number;
  minBlocksPerDay: number;
  maxBlocksPerDay: number;
  maxBlobsPerBlock: number;
  maxBlobsPerTx: number;
  maxUniqueBlobs: number;
  maxUniqueAddresses: number;
  maxBlobBytesSize: number;
};

export const seedParams: SeedParams = {
  totalDays: 90,
  minBlocksPerDay: 500,
  maxBlocksPerDay: 1000,

  maxBlobsPerBlock: 6,
  maxBlobsPerTx: 3,

  maxUniqueBlobs: 100,
  maxUniqueAddresses: 10_000,

  maxBlobBytesSize: 1024,
};
