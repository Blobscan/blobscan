import type { TimeFrame } from "@blobscan/api";

import { transformToDatasets } from "~/components/TimeseriesCharts/helpers";
import { api } from "~/api-client";
import type { CategoriesParam, RollupsParam } from "~/schemas/filters";
import { toCommaSeparatedParam } from "~/schemas/utils";
import type { TimeseriesMetric } from "~/types";

export function useTimeseriesQuery(params: {
  metrics: [TimeseriesMetric, ...TimeseriesMetric[]];
  timeFrame?: TimeFrame;
  categories?: CategoriesParam;
  rollups?: RollupsParam;
}) {
  const { metrics, timeFrame, categories, rollups } = params;
  const isGlobalTimeseries = !categories?.length && !rollups?.length;

  return api.stats.getTimeseries.useQuery(
    {
      metrics: toCommaSeparatedParam(metrics),
      categories: categories ? toCommaSeparatedParam(categories) : undefined,
      rollups: rollups ? toCommaSeparatedParam(rollups) : undefined,
      timeFrame,
      sort: "asc",
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: ({ data }) => {
        const datasets = transformToDatasets(data);

        return isGlobalTimeseries ? datasets[0] : datasets;
      },
    }
  );
}
