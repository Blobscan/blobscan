import { ROLLUP_DEFINITIONS } from "./generated/registry";
import type { BlobPosterRegistry, Rollup, RollupDefinition } from "./types";

export class RollupRegistry {
  public readonly registry: BlobPosterRegistry;

  constructor(blobPosters: BlobPosterRegistry) {
    this.registry = blobPosters;
  }

  static create(chainId: number) {
    const registry: BlobPosterRegistry = {};
    for (const definition of Object.values(ROLLUP_DEFINITIONS)) {
      const posters = (definition as RollupDefinition).blobPosters[chainId];
      if (posters?.length) {
        registry[definition.id.toUpperCase() as Rollup] = [...posters];
      }
    }
    return new RollupRegistry(registry);
  }

  hasRollup(rollup: Rollup) {
    return !!this.registry[rollup]?.length;
  }

  geAll() {
    return Object.entries(this.registry);
  }

  getBlobPosters(rollup: Rollup) {
    return this.registry[rollup] ?? [];
  }

  getRollup(blobPoster: string) {
    const rollup = Object.entries(this.registry).find(([_, blobPosters]) => {
      return blobPosters.some(
        (address) => address.toLowerCase() === blobPoster.toLowerCase()
      );
    });

    if (!rollup) {
      return null;
    }

    return rollup[0] as Rollup;
  }
}
