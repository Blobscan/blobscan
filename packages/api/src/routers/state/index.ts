import { t } from "../../trpc-client";
import { getAppState } from "./getAppState";

export const stateRouter = t.router({
  getAppState,
});
