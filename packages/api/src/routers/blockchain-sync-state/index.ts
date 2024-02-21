import { t } from "../../trpc-client";
import { getState } from "./getState";
import { updateState } from "./updateState";

export const blockchainSyncStateRouter = t.router({
  getState,
  updateState,
});
