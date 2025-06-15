import { t } from "../../trpc-client";
import { getByTimestamp } from "./getByTimestamp";

export const ethPriceRouter = t.router({
  getByTimestamp,
});
