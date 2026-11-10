import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByHash } from "./getByHash";
import { getCount } from "./getCount";
import { getSenderAdjacentsByHash } from "./getSenderAdjacentsByHash";

export const transactionRouter = t.router({
  getAll,
  getByHash,
  getCount,
  getSenderAdjacentsByHash,
});
