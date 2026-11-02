import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { AvgBlobBaseFeeUsdChart } from "~/components/TimeseriesCharts/AvgBlobBaseFeeUsdChart";

const AvgBlobBaseFeeUsd: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={AvgBlobBaseFeeUsdChart}
      description="This chart shows the average blob base fee per day in USD. Each fee is converted at the ETH price of the minute of its block."
      enableControls={false}
      title="Average Blob Base Fee (USD) Stats"
    />
  );
};

export default AvgBlobBaseFeeUsd;
