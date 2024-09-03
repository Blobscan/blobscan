import { t } from "../../trpc-client";
import { getAll } from "./getAll";

export const rollupRouter = t.router({
  getAll,
});
