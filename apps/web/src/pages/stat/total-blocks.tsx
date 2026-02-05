import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlocksChart } from "~/components/TimeseriesCharts";

const TotalBlocks: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlocksChart}
      title="Total Blocks Stats"
      description="This chart shows the total amount of blocks containing blob transactions per day."
    />
  );
};

export default TotalBlocks;
