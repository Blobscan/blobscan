import { blockchainSyncStateRouter } from "./src/routers/blockchain-sync-state";
import { indexerRouter } from "./src/routers/indexer";
import { createSharedAppRouter } from "./src/shared-app-router";
import { t } from "./src/trpc-client";

const sharedAppRouter = createSharedAppRouter();

export const appRouter = t.mergeRouters(
  sharedAppRouter,
  t.router({
    indexer: indexerRouter,
    syncState: blockchainSyncStateRouter,
  })
);

export type AppRouter = typeof appRouter;
