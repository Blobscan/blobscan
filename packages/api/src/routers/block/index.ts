import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByBlockNumber } from "./getByBlockNumber";
import { getByHash } from "./getByHash";

export const blockRouter = t.router({
  getAll,
  getByBlockNumber,
  getByHash,
});
