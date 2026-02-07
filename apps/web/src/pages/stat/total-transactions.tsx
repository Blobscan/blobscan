import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalTransactionsChart } from "~/components/TimeseriesCharts/TotalTransactionsChart";

const TotalTransactions: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalTransactionsChart}
      description="This chart shows the total number of blob transactions per day, broken down by category and rollup."
      title="Total Transactions Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalTransactions;
