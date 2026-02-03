import type { NextPage } from "next";

import { TotalTransactionsChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";

const TotalTransactions: NextPage = function () {
  const {
    filterParams: { category, rollups },
  } = useQueryParams();
  const filtersSet = category || rollups;
  const { data: totalTransactionsDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: filtersSet ? category : "other",
      rollups: filtersSet ? rollups?.join(MULTIPLE_VALUES_SEPARATOR) : "all",
      sort: "asc",
      metrics: "totalTransactions",
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
      title="Total Transactions Stats"
      description="This chart shows the total number of blob transactions per day, broken down by category and rollup."
      enableFilters
      chart={
        <TotalTransactionsChart
          size="2xl"
          datasets={totalTransactionsDatasets}
          loadingOpts={{
            timeFrame: "180d",
          }}
        />
      }
    />
  );
};

export default TotalTransactions;
