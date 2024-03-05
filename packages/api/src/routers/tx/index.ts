import { t } from "../../trpc-client";
import { getAll } from "./getAll";
import { getAllFull } from "./getAllFull";
import { getByAddress } from "./getByAddress";
import { getByHash } from "./getByHash";
import { getByHashFull } from "./getByHashFull";

export const transactionRouter = t.router({
  getAll,
  getAllFull,
  getByAddress,
  getByHash,
  getByHashFull,
});
