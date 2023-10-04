import { t } from "../../trpc-client";
import { byTerm } from "./byTerm";

export const searchRouter = t.router({
  byTerm,
});
