import type { ROLLUP_DEFINITIONS } from "./generated/registry";

export interface RollupDefinition {
  name: string;
  color: { light: string; dark: string };
  icon: string;
  iconClassname?: string;
  blobPosters: Record<number, [string, ...string[]]>;
}

export type RollupId = keyof typeof ROLLUP_DEFINITIONS;
export type Rollup = Uppercase<RollupId>;
export type BlobPosterRegistry = Partial<Record<Rollup, [string, ...string[]]>>;
