import type { NextPage } from "next";

import { TotalBlocksChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

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
