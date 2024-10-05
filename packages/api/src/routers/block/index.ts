import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";
import { getCount } from "./getCount";
import { getLatestBlock } from "./getGasPrice";

export const blockRouter = t.router({
  getAll,
  getByBlockId,
  getCount,
  getLatestBlock,
});
