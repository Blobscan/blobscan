import type { NextPage } from "next";

import { TotalBlobGasComparisonChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalBlobGasUsedComparison: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalBlobGasComparisonChart}
      description="This chart compares the daily total blob gas usage with the amount of gas that would have been consumed if the same data were submitted as calldata."
      title="Total Blob Gas Used Comparison"
    />
  );
};

export default TotalBlobGasUsedComparison;
