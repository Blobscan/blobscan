import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByHash } from "./getByHash";

export const transactionRouter = t.router({
  getAll,
  getByHash,
});
