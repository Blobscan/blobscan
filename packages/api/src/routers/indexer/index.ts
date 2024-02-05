import { t } from "../../trpc-client";
import { handleReorgedSlot } from "./handleReorgedSlot";
import { indexData } from "./indexData";

export const indexerRouter = t.router({
  handleReorgedSlot,
  indexData,
});
