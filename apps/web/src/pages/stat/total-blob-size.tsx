import type { NextPage } from "next";

import { TotalBlobSizeChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalBlobSize: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobSizeChart}
      description="This chart shows the total amount of blob data posted per day, broken down by category and rollup."
      title="Total Blob Size Stats"
      enableFilters
    />
  );
};

export default TotalBlobSize;
