import { t } from "../../trpc-client";
import { checkBlockExists } from "./checkBlobExists";
import { getAdjacentBlock } from "./getAdjacentBlock";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";
import { getBySlot } from "./getBySlot";
import { getCount } from "./getCount";
import { getLatest } from "./getLatest";

export const blockRouter = t.router({
  checkBlockExists,
  getAdjacentBlock,
  getAll,
  getByBlockId,
  getBySlot,
  getCount,
  getLatest,
});
