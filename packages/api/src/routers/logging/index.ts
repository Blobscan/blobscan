import { t } from "../../trpc-client";
import { getLevel } from "./getLevel";
import { updateLevel } from "./updateLevel";

export const loggingRouter = t.router({
  getLevel,
  updateLevel,
});
