import { t } from "../../trpc-client";
import { getAllOverallStats } from "./getAllOverallStats";
import { getBlobDailyStats } from "./getBlobDailyStats";
import { getBlobOverallStats } from "./getBlobOverallStats";
import { getBlockDailyStats } from "./getBlockDailyStats";
import { getBlockOverallStats } from "./getBlockOverallStats";
import { getTransactionOverallStats } from "./getOverallStats";
import { getTransactionDailyStats } from "./getTransactionDailyStats";

export const statsRouter = t.router({
  getAllOverallStats,
  getBlobDailyStats,
  getBlobOverallStats,
  getBlockDailyStats,
  getBlockOverallStats,
  getTransactionDailyStats,
  getTransactionOverallStats,
});
