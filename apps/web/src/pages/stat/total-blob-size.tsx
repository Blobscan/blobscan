import type { NextPage } from "next";

import { TotalBlobSizeChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const TotalBlobSize: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;
  const { data: dailyBlobsDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalBlobSize",
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
      title="Total Blob Size Stats"
      description="This chart shows the total amount of blob data posted per day, broken down by category and rollup."
      enableFilters
      chart={
        <TotalBlobSizeChart
          size="2xl"
          datasets={dailyBlobsDatasets}
          loadingOpts={{
            timeFrame: "180d",
          }}
        />
      }
    />
  );
};

export default TotalBlobSize;
