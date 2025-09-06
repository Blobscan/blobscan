import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { BlobRouterConfig } from "./routers/blob";
import { createBlobRouter } from "./routers/blob";
import { blobStoragesStateRouter } from "./routers/blob-storages-state";
import { blockRouter } from "./routers/block";
import { blockchainSyncStateRouter } from "./routers/blockchain-sync-state";
import { ethPriceRouter } from "./routers/eth-price";
import { healthcheck } from "./routers/healthcheck";
import { indexerRouter } from "./routers/indexer";
import { search } from "./routers/search";
import { stateRouter } from "./routers/state";
import { statsRouter } from "./routers/stats";
import { transactionRouter } from "./routers/tx";
import { t } from "./trpc-client";

export type AppRouterConfig = {
  blobRouter: BlobRouterConfig;
};

export function createAppRouter(config?: AppRouterConfig) {
  return t.router({
    healthcheck,
    search,
    blob: createBlobRouter(config?.blobRouter),
    blobStoragesState: blobStoragesStateRouter,
    block: blockRouter,
    syncState: blockchainSyncStateRouter,
    ethPrice: ethPriceRouter,
    indexer: indexerRouter,
    stats: statsRouter,
    state: stateRouter,
    tx: transactionRouter,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;

export type AppRouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type AppRouterOutputs = inferRouterOutputs<AppRouter>;
