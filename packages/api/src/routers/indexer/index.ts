import { t } from "../../trpc-client";
import { getSlot } from "./getSlot";
import { indexData } from "./indexData";
import { updateSlot } from "./updateSlot";

export const indexerRouter = t.router({
  getSlot,
  indexData,
  updateSlot,
});
