import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getAllByCursor } from "./getAllByCursor";
import { getByHash } from "./getByHash";
import { getCount } from "./getCount";
import { getSenderAdjacentTx } from "./getSenderAdjacentTx";

export const transactionRouter = t.router({
  getAll,
  getAllByCursor,
  getByHash,
  getCount,
  getSenderAdjacentTx,
});
