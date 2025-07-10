import { blobRouter } from "./routers/blob";
import { blobStoragesStateRouter } from "./routers/blob-storages-state";
import { blockRouter } from "./routers/block";
import { ethPriceRouter } from "./routers/eth-price";
import { healthcheck } from "./routers/healthcheck";
import { searchRouter } from "./routers/search";
import { statsRouter } from "./routers/stats";
import { transactionRouter } from "./routers/tx";
import { t } from "./trpc-client";

export function createSharedAppRouter() {
  return t.router({
    block: blockRouter,
    tx: transactionRouter,
    blob: blobRouter,
    search: searchRouter,
    stats: statsRouter,
    blobStoragesState: blobStoragesStateRouter,
    ethPrice: ethPriceRouter,
    healthcheck,
  });
}

export type SharedAppRouter = ReturnType<typeof createSharedAppRouter>;
