import { t } from "../../trpc-client";
import { getOverallStats } from "./getOverallStats";
import { getTimeseries } from "./getTimeseries";

export const statsRouter = t.router({
  getTimeseries,
  getOverallStats,
});
