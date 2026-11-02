import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobBaseFeesChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesChart";
import { TotalBlobBaseFeesUsdChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesUsdChart";

const TotalBlobBaseFees: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobBaseFeesChart}
      usdChart={TotalBlobBaseFeesUsdChart}
      description="This chart shows the total amount of blob base fees per day, broken down by rollup and category. In USD, each fee is converted at the ETH price of the minute of its block."
      title="Total Blob Base Fees Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobBaseFees;
