import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobGasUsedChart } from "~/components/TimeseriesCharts/TotalBlobGasUsedChart";

const TotalBlobGasUsed: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobGasUsedChart}
      description="This chart shows the total amount of blob gas used per day, broken down by rollup and category."
      title="Total Blob Gas Used Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobGasUsed;
