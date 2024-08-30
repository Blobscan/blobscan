import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";
import { getLatestBlock } from "./getGasPrice";

export const blockRouter = t.router({
  getAll,
  getByBlockId,
  getLatestBlock,
});
