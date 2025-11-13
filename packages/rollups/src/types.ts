import type { Rollup } from "@blobscan/db/prisma/enums";

export type BlobPosterRegistry = {
  [k in Rollup]?: [string, ...string[]];
};
