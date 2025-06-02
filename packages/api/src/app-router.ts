import { z } from "@blobscan/zod";

import { publicProcedure } from "./procedures";
import { blobRouter } from "./routers/blob";
import { blobStoragesStateRouter } from "./routers/blob-storages-state";
import { blockRouter } from "./routers/block";
import { blockchainSyncStateRouter } from "./routers/blockchain-sync-state";
import { ethPriceRouter } from "./routers/eth-price";
import { indexerRouter } from "./routers/indexer";
import { searchRouter } from "./routers/search";
import { statsRouter } from "./routers/stats";
import { transactionRouter } from "./routers/tx";
import { t } from "./trpc-client";

export const appRouter = t.router({
  block: blockRouter,
  tx: transactionRouter,
  blob: blobRouter,
  search: searchRouter,
  stats: statsRouter,
  indexer: indexerRouter,
  syncState: blockchainSyncStateRouter,
  blobStoragesState: blobStoragesStateRouter,
  ethPrice: ethPriceRouter,
  healthcheck: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/healthcheck",
        summary: "connection healthcheck.",
        tags: ["system"],
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => "yay!"),
});

// export type definition of API
export type AppRouter = typeof appRouter;
