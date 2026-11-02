import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobBaseFeesUsdChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesUsdChart";

const TotalBlobBaseFeesUsd: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobBaseFeesUsdChart}
      description="This chart shows the total amount of blob base fees per day in USD, broken down by rollup and category. Each fee is converted at the ETH price of the minute of its block."
      title="Total Blob Base Fees (USD) Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobBaseFeesUsd;
