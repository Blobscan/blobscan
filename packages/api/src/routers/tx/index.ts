import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getByHash } from "./getByHash";
import { getCount } from "./getCount";
import { getTxNeighborsProcedure } from "./getNextTxFromSender";

export const transactionRouter = t.router({
  getAll,
  getByHash,
  getCount,
  getTxNeighbors: getTxNeighborsProcedure,
});
