import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import {
  outputSchema as getBlobDailyStatsOutputSchema,
  getBlobDailyStatsQuery,
} from "./getBlobDailyStats";
import {
  outputSchema as getBlockDailyStatsOutputSchema,
  getBlockDailyStatsQuery,
} from "./getBlockDailyStats";
import {
  outputSchema as getTransactionDailyStatsOutputSchema,
  getTransactionDailyStatsQuery,
} from "./getTransactionDailyStats";

const inputSchema = withTimeFrameSchema;

const outputSchema = z.object({
  blob: getBlobDailyStatsOutputSchema,
  block: getBlockDailyStatsOutputSchema,
  transaction: getTransactionDailyStatsOutputSchema,
});

export const getAllDailyStats = publicProcedure
  .input(inputSchema)
  .use(withTimeFrame)
  .output(outputSchema)
  .query(({ ctx }) =>
    Promise.all([
      getBlobDailyStatsQuery(ctx),
      getBlockDailyStatsQuery(ctx),
      getTransactionDailyStatsQuery(ctx),
    ]).then(([blob, block, transaction]) => ({
      blob,
      block,
      transaction,
    }))
  );
