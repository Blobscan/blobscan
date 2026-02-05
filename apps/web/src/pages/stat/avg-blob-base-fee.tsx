import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { AvgBlobBaseFeeChart } from "~/components/TimeseriesCharts";

const AvgBlobBaseFee: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={AvgBlobBaseFeeChart}
      description="This chart shows the average blob base fee per day."
      enableFilters={false}
      title="Average Blob Base Fee Stats"
    />
  );
};

export default AvgBlobBaseFee;
