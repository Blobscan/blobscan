import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByAddress } from "./getByAddress";
import { getByHash } from "./getByHash";

export const transactionRouter = t.router({
  getAll,
  getByAddress,
  getByHash,
});
