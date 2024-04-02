import { t } from "../../trpc-client";
import { getState } from "./getState";

export const blobStoragesStateRouter = t.router({
  getState,
});
