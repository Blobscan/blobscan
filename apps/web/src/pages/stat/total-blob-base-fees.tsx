import type { NextPage } from "next";

import { TotalBlobBaseFeesChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalBlobBaseFees: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobBaseFeesChart}
      description="This chart shows the total amount of  blob base fees per day, broken down by rollup and category."
      title="Total Blob Base Fees Stats"
      enableFilters
    />
  );
};

export default TotalBlobBaseFees;
