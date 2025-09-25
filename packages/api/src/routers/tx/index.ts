import { t } from "../../trpc-client";
import { getAdjacentsByAddress } from "./getAdjacentsByAddress";
import { getAll } from "./getAll";
import { getByHash } from "./getByHash";
import { getCount } from "./getCount";

export const transactionRouter = t.router({
  getAll,
  getByHash,
  getCount,
  getAdjacentsByAddress,
});
