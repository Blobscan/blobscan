import type { TimeFrame } from "@blobscan/api";

import { transformToDatasets } from "~/components/TimeseriesCharts/helpers";
import { api } from "~/api-client";
import type { TimeseriesMetric } from "~/types";
import { MULTIPLE_VALUES_SEPARATOR, useQueryParams } from "./useQueryParams";

const globalMetrics = ["avgBlobFee", "avgBlobGasPrice", "totalBlocks"];

export function useTimeseriesQuery(
  params: {
    metrics: [TimeseriesMetric, ...TimeseriesMetric[]];
    timeFrame?: TimeFrame;
    categories?: string;
    rollups?: string;
  },
  options?: {
    onlyGlobal?: boolean;
  }
) {
  const {
    metrics,
    timeFrame,
    categories: categoriesParam,
    rollups: rollupsParam,
  } = params;
  const {
    filterParams: { category: categoryQueryParam, rollups: rollupsQueryParam },
  } = useQueryParams();
  const isGlobalMetric =
    options?.onlyGlobal || metrics.every((m) => globalMetrics.includes(m));
  const metricsParam = metrics.join(MULTIPLE_VALUES_SEPARATOR);
  const categories =
    categoriesParam ??
    categoryQueryParam ??
    (!rollupsParam ? "other" : undefined);
  const rollups =
    rollupsParam ??
    (!rollupsQueryParam
      ? "all"
      : rollupsQueryParam.join(MULTIPLE_VALUES_SEPARATOR));

  return api.stats.getTimeseries.useQuery(
    {
      metrics: metricsParam,
      categories: isGlobalMetric ? undefined : categories,
      rollups: isGlobalMetric ? undefined : rollups,
      timeFrame,
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
