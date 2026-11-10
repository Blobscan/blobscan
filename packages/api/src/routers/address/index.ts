import { t } from "../../trpc-client";
import { getOverall } from "./getOverall";
import { getTimeseries } from "./getTimeseries";

export const addressRouter = t.router({
  getOverall,
  getTimeseries,
});
