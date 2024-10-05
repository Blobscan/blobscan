import { Category, Rollup } from "../enums";

export type SeedParams = {
  totalDays: number;
  minBlocksPerDay: number;
  maxBlocksPerDay: number;
  maxUniqueAddresses: number;

  categoryWeights: { value: Category; weight: number }[];
  rollupWeights: { value: Rollup; weight: number }[];
  uniqueBlobsRatio: number;
  reorgRatio: number;

  gasPerBlob: number;
};

export const seedParams: SeedParams = {
  totalDays: 10,
  minBlocksPerDay: 1000,
  maxBlocksPerDay: 1500,

  maxUniqueAddresses: 1000,

  categoryWeights: [
    {
      value: Category.OTHER,
      weight: 0.2,
    },
    {
      value: Category.ROLLUP,
      weight: 0.8,
    },
  ],
  rollupWeights: [
    { value: Rollup.ARBITRUM, weight: 0.08096648 },
    { value: Rollup.BASE, weight: 0.10522268 },
    { value: Rollup.OPTIMISM, weight: 0.03785166 },
    { value: Rollup.SCROLL, weight: 0.10230571 },
    { value: Rollup.STARKNET, weight: 0.043719 },
    { value: Rollup.ZKSYNC, weight: 0.02146207 },
    { value: Rollup.MODE, weight: 0.00489422 },
    { value: Rollup.ZORA, weight: 0.00515352 },
    { value: Rollup.LINEA, weight: 0.04148197 },
    { value: Rollup.PARADEX, weight: 0.03303769 },
    { value: Rollup.BOBA, weight: 0.00515216 },
    { value: Rollup.CAMP, weight: 0.00147192 },
    { value: Rollup.KROMA, weight: 0.01695014 },
    { value: Rollup.METAL, weight: 0.02825735 },
    { value: Rollup.PGN, weight: 0.00021592 },
    { value: Rollup.BLAST, weight: 0.02580827 },
    { value: Rollup.OPTOPIA, weight: 0.006698 },
    { value: Rollup.TAIKO, weight: 0.27215873 },
  ],
  uniqueBlobsRatio: 0.04,
  reorgRatio: 0.01,
  gasPerBlob: 2 ** 17, // 131_072
};
