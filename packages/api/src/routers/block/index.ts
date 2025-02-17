import { t } from "../../trpc-client";
import { checkBlockExists } from "./checkBlobExists";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";
import { getBySlot } from "./getBySlot";
import { getCount } from "./getCount";
import { getLatestBlock } from "./getGasPrice";

export const blockRouter = t.router({
  getAll,
  getByBlockId,
  getBySlot,
  getCount,
  getLatestBlock,
  checkBlockExists,
});
