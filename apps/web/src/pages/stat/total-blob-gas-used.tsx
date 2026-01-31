import type { NextPage } from "next";

import { TotalBlobGasUsedChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const TotalBlobGasUsed: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;
  const { data: totalBlobGasUsedDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalBlobGasUsed",
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
      title="Total Blob Gas Used Stats"
      description="This chart shows the total amount of blob gas used per day, broken down by rollup and category."
      enableFilters
      chart={
        <TotalBlobGasUsedChart size="2xl" datasets={totalBlobGasUsedDatasets} />
      }
    />
  );
};

export default TotalBlobGasUsed;
