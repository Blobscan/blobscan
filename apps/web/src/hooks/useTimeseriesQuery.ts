import type { TimeFrame } from "@blobscan/api";

import { transformToDatasets } from "~/components/TimeseriesCharts/helpers";
import { api } from "~/api-client";
import type { TimeseriesMetric } from "~/types";
import type { CategoriesSchema, RollupsSchema } from "./useQueryParams";
import { serializedMultiValueParam } from "./useQueryParams";

export function useTimeseriesQuery(params: {
  metrics: [TimeseriesMetric, ...TimeseriesMetric[]];
  timeFrame?: TimeFrame;
  categories?: CategoriesSchema;
  rollups?: RollupsSchema;
}) {
  const { metrics, timeFrame, categories, rollups } = params;
  const isGlobalTimeseries = !categories?.length && !rollups?.length;

  return api.stats.getTimeseries.useQuery(
    {
      metrics: serializedMultiValueParam(metrics),
      categories: categories
        ? serializedMultiValueParam(categories)
        : undefined,
      rollups: rollups ? serializedMultiValueParam(rollups) : undefined,
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
