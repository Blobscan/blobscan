import type { Rollup } from "@blobscan/db/prisma/enums";

import { GNOSIS_REGISTRY } from "./blob-posters/gnosis";
import { HOLESKY_REGISTRY } from "./blob-posters/holesky";
import { HOODI_REGISTRY } from "./blob-posters/hoodi";
import { MAINNET_REGISTRY } from "./blob-posters/mainnet";
import { SEPOLIA_REGISTRY } from "./blob-posters/sepolia";
import type { BlobPosterRegistry } from "./types";

export class RollupRegistry {
  public readonly registry: BlobPosterRegistry;

  constructor(blobPosters: BlobPosterRegistry) {
    this.registry = blobPosters;
  }

  static create(chainId: number) {
    switch (chainId) {
      case 1:
        return new RollupRegistry(MAINNET_REGISTRY);
      case 167004:
        return new RollupRegistry(HOLESKY_REGISTRY);
      case 11155111:
        return new RollupRegistry(SEPOLIA_REGISTRY);
      case 560048:
        return new RollupRegistry(HOODI_REGISTRY);
      case 100:
        return new RollupRegistry(GNOSIS_REGISTRY);
      default:
        return new RollupRegistry({});
    }
  }

  geAll() {
    return Object.entries(this.registry);
  }

  getBlobPosters(rollup: Rollup) {
    return this.registry[rollup] ?? [];
  }

  getRollup(blobPoster: string) {
    const rollup = Object.entries(this.registry).find(([_, blobPosters]) => {
      return blobPosters.includes(blobPoster);
    });

    if (!rollup) {
      return null;
    }

    return rollup[0] as Rollup;
  }
}
