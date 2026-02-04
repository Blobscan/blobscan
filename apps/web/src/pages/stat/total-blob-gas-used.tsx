import type { NextPage } from "next";

import { TotalBlobGasUsedChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalBlobGasUsed: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobGasUsedChart}
      description="This chart shows the total amount of blob gas used per day, broken down by rollup and category."
      title="Total Blob Gas Used Stats"
      enableFilters
    />
  );
};

export default TotalBlobGasUsed;
