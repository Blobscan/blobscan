import type { NextPage } from "next";

import { TotalBlobBaseFeesChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const TotalBlobBaseFees: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;

  const { data: avgBlobBaseFeeDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalBlobFee",
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
      title="Total Blob Base Fees Stats"
      description="This chart shows the total amount of  blob base fees per day, broken down by rollup and category."
      enableFilters
      chart={
        <TotalBlobBaseFeesChart size="2xl" datasets={avgBlobBaseFeeDatasets} />
      }
    />
  );
};

export default TotalBlobBaseFees;
