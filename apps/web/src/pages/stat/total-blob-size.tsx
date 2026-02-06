import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobSizeChart } from "~/components/TimeseriesCharts";

const TotalBlobSize: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobSizeChart}
      description="This chart shows the total amount of blob data posted per day, broken down by category and rollup."
      title="Total Blob Size Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobSize;
