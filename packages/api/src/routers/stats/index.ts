import { t } from "../../trpc-client";
import { getAllOverallStats } from "./getAllOverallStats";
import { getBalance } from "./getBalance";
import { getBlobDailyStats } from "./getBlobDailyStats";
import { getBlobOverallStats } from "./getBlobOverallStats";
import { getBlockDailyStats } from "./getBlockDailyStats";
import { getBlockOverallStats } from "./getBlockOverallStats";
import { getGenesisTime } from "./getGenesisTime";
import { getTransaction } from "./getTransaction";
import { getTransactionDailyStats } from "./getTransactionDailyStats";
import { getTransactionOverallStats } from "./getTransactionOverallStats";
import { getAllValidators } from "./getAllValidators";
import { getValidatorDetailByKeyOrIdx } from "./getValidatorDetailByKeyOrIdx";

export const statsRouter = t.router({
  getAllOverallStats,
  getBalance,
  getBlobDailyStats,
  getBlobOverallStats,
  getBlockDailyStats,
  getBlockOverallStats,
  getGenesisTime,
  getTransaction,
  getTransactionDailyStats,
  getTransactionOverallStats,
  getAllValidators,
  getValidatorDetailByKeyOrIdx,
});
