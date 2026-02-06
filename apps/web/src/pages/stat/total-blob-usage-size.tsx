import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobUsageSizeChart } from "~/components/TimeseriesCharts";

const TotalBlobUsageSize: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobUsageSizeChart}
      description="This chart shows the total amount of blob data containing meaningful non-zero data per day, broken down by category and rollup."
      title="Total Blob Usage Size Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobUsageSize;
