import { blockchainSyncStateRouter } from "../../src/routers/blockchain-sync-state";
import { t } from "../../src/trpc-client";

export const createBlockchainSyncStateCaller = t.createCallerFactory(
  blockchainSyncStateRouter
);

export type BlockchainSyncStateCaller = ReturnType<
  typeof createBlockchainSyncStateCaller
>;
