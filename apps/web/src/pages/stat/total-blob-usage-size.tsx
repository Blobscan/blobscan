import type { NextPage } from "next";

import { TotalBlobUsageSizeChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalBlobUsageSize: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobUsageSizeChart}
      description="This chart shows the total amount of blob data containing meaningful non-zero data per day, broken down by category and rollup."
      title="Total Blob Usage Size Stats"
      enableFilters
    />
  );
};

export default TotalBlobUsageSize;
