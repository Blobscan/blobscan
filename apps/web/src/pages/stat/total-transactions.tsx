import type { NextPage } from "next";

import { TotalTransactionsChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalTransactions: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalTransactionsChart}
      description="This chart shows the total number of blob transactions per day, broken down by category and rollup."
      title="Total Transactions Stats"
      enableFilters
    />
  );
};

export default TotalTransactions;
