import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getAllFull } from "./getAllFull";
import { getByBlockId } from "./getByBlockId";
import { getByBlockIdFull } from "./getByBlockIdFull";

export const blockRouter = t.router({
  getAll,
  getAllFull,
  getByBlockId,
  getByBlockIdFull,
});
