import { t } from "../../trpc-client";
import { getState } from "./getState";

export const syncStateRouter = t.router({
  getState,
});
