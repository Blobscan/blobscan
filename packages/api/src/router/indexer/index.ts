import { createTRPCRouter } from "../../trpc";
import { getSlot } from "./getSlot";
import { indexData } from "./indexData";
import { updateSlot } from "./updateSlot";

export const indexerRouter = createTRPCRouter({
  getSlot,
  indexData,
  updateSlot,
});
