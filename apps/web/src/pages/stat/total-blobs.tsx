import type { NextPage } from "next";

import { TotalBlobsChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const DailyBlobs: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;
  const { data: totalBlobsDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalBlobs",
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: ({ data }) => transformToDatasets(data),
    }
  );

  return (
    <StatPageLayout
      title="Total Blobs Stats"
      description="This chart shows the total amount of blobs posted per day, broken down by category and rollup."
      enableFilters
      chart={<TotalBlobsChart size="2xl" datasets={totalBlobsDatasets} />}
    />
  );
};

export default DailyBlobs;
