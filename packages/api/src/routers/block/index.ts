import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlockId } from "./getByBlockId";

export const blockRouter = t.router({
  getAll,
  getByBlockId,
});
