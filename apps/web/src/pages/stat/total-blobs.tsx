import type { NextPage } from "next";

import { TotalBlobsChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const DailyBlobs: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobsChart}
      description="This chart shows the total amount of blobs posted per day, broken down by category and rollup."
      title="Total Blobs Stats"
      enableFilters
    />
  );
};

export default DailyBlobs;
