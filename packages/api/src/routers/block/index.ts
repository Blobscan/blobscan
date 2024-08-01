import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";
import { getLatestGasPrice } from "./getGasPrice";

export const blockRouter = t.router({
  getAll,
  getByBlockId,
  getLatestGasPrice,
});
