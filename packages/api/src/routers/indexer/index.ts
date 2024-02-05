import { t } from "../../trpc-client";
import { getLastSyncedSlots } from "./getLastSyncedSlots";
import { handleReorgedSlot } from "./handleReorgedSlot";
import { indexData } from "./indexData";
import { updateLastSyncedSlots } from "./updateLastSyncedSlots";

export const indexerRouter = t.router({
  getLastSyncedSlots,
  handleReorgedSlot,
  indexData,
  updateLastSyncedSlots,
});
