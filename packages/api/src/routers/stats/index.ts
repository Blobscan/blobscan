import { t } from "../../trpc-client";
import { getAllOverallStats } from "./getAllOverallStats";
import { getBlobDailyStats } from "./getBlobDailyStats";
import { getBlobOverallStats } from "./getBlobOverallStats";
import { getBlockDailyStats } from "./getBlockDailyStats";
import { getBlockOverallStats } from "./getBlockOverallStats";
import { getTransactionDailyStats } from "./getTransactionDailyStats";
import { getTransactionOverallStats } from "./getTransactionOverallStats";
import { getBalance } from "./getBalance";
import { getAllValidators } from "./getValidators"

export const statsRouter = t.router({
  getAllOverallStats,
  getBlobDailyStats,
  getBlobOverallStats,
  getBlockDailyStats,
  getBlockOverallStats,
  getTransactionDailyStats,
  getTransactionOverallStats,
  getBalance,
  getAllValidators,
});
