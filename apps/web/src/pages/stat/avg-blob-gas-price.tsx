import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { AvgBlobGasPriceChart } from "~/components/TimeseriesCharts/AvgBlobGasPriceChart";

const AvgBlobGasPrice: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={AvgBlobGasPriceChart}
      description="This chart shows the average blob gas price per day."
      title="Average Blob Gas Price"
    />
  );
};

export default AvgBlobGasPrice;
