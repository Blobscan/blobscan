import type { NextPage } from "next";

import { TotalBlobUsageSizeChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const TotalBlobUsageSize: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;
  const { data: totalBlobUsageSizeDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalBlobUsageSize",
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
      title="Total Blob Usage Size Stats"
      description="This chart shows the total amount of blob data containing meaningful non-zero data per day, broken down by category and rollup."
      enableFilters
      chart={
        <TotalBlobUsageSizeChart
          size="2xl"
          datasets={totalBlobUsageSizeDatasets}
          loadingOpts={{
            timeFrame: "180d",
          }}
        />
      }
    />
  );
};

export default TotalBlobUsageSize;
