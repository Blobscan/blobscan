import { Rollup } from "@blobscan/db";

import { publicProcedure } from "../../procedures";

type Rollups = Lowercase<keyof typeof Rollup>[];

export const getAll = publicProcedure.query(() => {
  return Object.keys(Rollup).map((rollup) => rollup.toLowerCase()) as Rollups;
});
