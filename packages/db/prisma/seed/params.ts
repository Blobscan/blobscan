import { RollupRegistry } from "@blobscan/rollups";

import type { Rollup } from "../enums";
import { Category } from "../enums";

const rollupRegistry = RollupRegistry.create(1);

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
  totalDays: 4,
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
  rollupWeights: rollupRegistry.geAll().map(([name]) => ({
    value: name as Rollup,
    weight: 0.5,
  })),
  uniqueBlobsRatio: 0.04,
  reorgRatio: 0.01,
  gasPerBlob: 2 ** 17, // 131_072
};
