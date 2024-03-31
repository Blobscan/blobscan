import { t } from "../../trpc-client";
import { getState } from "./getState";

export const swarmStateRouter = t.router({
  getState,
});
