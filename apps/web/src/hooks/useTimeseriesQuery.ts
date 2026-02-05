import { transformToDatasets } from "~/components/TimeseriesCharts/helpers";
import { api } from "~/api-client";
import type { TimeseriesMetric } from "~/types";
import { MULTIPLE_VALUES_SEPARATOR, useQueryParams } from "./useQueryParams";

const globalMetrics = ["avgBlobFee", "avgBlobGasPrice", "totalBlocks"];

export function useTimeseriesQuery(
  metrics: [TimeseriesMetric, ...TimeseriesMetric[]],
  options?: {
    onlyGlobal?: boolean;
  }
) {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const isGlobalMetric =
    options?.onlyGlobal || metrics.every((m) => globalMetrics.includes(m));
  const metricsParam = metrics.join(MULTIPLE_VALUES_SEPARATOR);
  const categories = category ?? (!rollups ? "other" : undefined);
  const rollupsParam = !rollups
    ? "all"
    : rollups.join(MULTIPLE_VALUES_SEPARATOR);

  return api.stats.getTimeseries.useQuery(
    {
      metrics: metricsParam,
      categories: isGlobalMetric ? undefined : categories,
      rollups: isGlobalMetric ? undefined : rollupsParam,
      sort: "asc",
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: ({ data }) => {
        const datasets = transformToDatasets(data);

        return isGlobalMetric ? datasets[0] : datasets;
      },
    }
  );
}
