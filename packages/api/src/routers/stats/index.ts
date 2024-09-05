import { t } from "../../trpc-client";
import { getAllDailyStats } from "./getAllDailyStats";
import { getAllOverallStats } from "./getAllOverallStats";
import { getBlobDailyStats } from "./getBlobDailyStats";
import { getBlobOverallStats } from "./getBlobOverallStats";
import { getBlockDailyStats } from "./getBlockDailyStats";
import { getBlockOverallStats } from "./getBlockOverallStats";
import { getTransactionDailyStats } from "./getTransactionDailyStats";
import { getTransactionOverallStats } from "./getTransactionOverallStats";

export const statsRouter = t.router({
  getAllOverallStats,
  getAllDailyStats,
  getBlobDailyStats,
  getBlobOverallStats,
  getBlockDailyStats,
  getBlockOverallStats,
  getTransactionDailyStats,
  getTransactionOverallStats,
});
