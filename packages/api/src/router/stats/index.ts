import { createTRPCRouter } from "../../trpc";
import { blobStatsRouter } from "./blob";
import { blockStatsRouter } from "./block";
import { transactionStatsRouter } from "./transaction";

export const statsRouter = createTRPCRouter({
  blob: blobStatsRouter,
  block: blockStatsRouter,
  transaction: transactionStatsRouter,
});
