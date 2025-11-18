import { t } from "../../trpc-client";
import { getBlobDailyStats } from "./getBlobDailyStats";
import { getBlobOverallStats } from "./getBlobOverallStats";
import { getBlockDailyStats } from "./getBlockDailyStats";
import { getBlockOverallStats } from "./getBlockOverallStats";
import { getDailyStats } from "./getDailyStats";
import { getDailyStatsForCharts } from "./getDailyStatsForCharts";
import { getOverallStats } from "./getOverallStats";
import { getTransactionDailyStats } from "./getTransactionDailyStats";
import { getTransactionOverallStats } from "./getTransactionOverallStats";

export const statsRouter = t.router({
  getDailyStats,
  getDailyStatsForCharts,
  getOverallStats,
  getBlobDailyStats,
  getBlobOverallStats,
  getBlockDailyStats,
  getBlockOverallStats,
  getTransactionDailyStats,
  getTransactionOverallStats,
});
