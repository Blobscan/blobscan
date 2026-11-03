import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlocksChart } from "~/components/TimeseriesCharts/TotalBlocksChart";

const TotalBlocks: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlocksChart}
      title="Total Blocks Stats"
      description={(period) =>
        `This chart shows the total amount of blocks containing blob transactions per ${period}.`
      }
    />
  );
};

export default TotalBlocks;
