import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobBaseFeesChart } from "~/components/TimeseriesCharts";

const TotalBlobBaseFees: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobBaseFeesChart}
      description="This chart shows the total amount of  blob base fees per day, broken down by rollup and category."
      title="Total Blob Base Fees Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobBaseFees;
