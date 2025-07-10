import { blockchainSyncStateRouter } from "./src/routers/blockchain-sync-state";
import { indexerRouter } from "./src/routers/indexer";
import { createSharedRouter } from "./src/shared-app-router";
import { t } from "./src/trpc-client";

const sharedRouter = createSharedRouter();

export const appRouter = t.mergeRouters(
  sharedRouter,
  t.router({
    indexer: indexerRouter,
    syncState: blockchainSyncStateRouter,
  })
);

export type AppRouter = typeof appRouter;

export * from "@trpc/server/adapters/express";
