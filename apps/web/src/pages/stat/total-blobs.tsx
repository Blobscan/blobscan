import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobsChart } from "~/components/TimeseriesCharts/TotalBlobsChart";

const DailyBlobs: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobsChart}
      description={(period) =>
        `This chart shows the total amount of blobs posted per ${period}, broken down by category and rollup.`
      }
      title="Total Blobs Stats"
      isCategorizedTimeseries
    />
  );
};

export default DailyBlobs;
