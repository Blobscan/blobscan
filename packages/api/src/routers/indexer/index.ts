import { t } from "../../trpc-client";
import { handleReorgedSlots } from "./handleReorgedSlots";
import { indexData } from "./indexData";

export const indexerRouter = t.router({
  handleReorgedSlots,
  indexData,
});
