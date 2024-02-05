import { t } from "../../trpc-client";
import { getBlockchainSyncState } from "./getBlockchainSyncState";

export const blockchainSyncStateRouter = t.router({
  getBlockchainSyncState,
});
