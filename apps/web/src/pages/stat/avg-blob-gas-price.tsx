import type { NextPage } from "next";

import { AvgBlobGasPriceChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

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
