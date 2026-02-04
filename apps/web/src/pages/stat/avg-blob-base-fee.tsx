import type { NextPage } from "next";

import { AvgBlobBaseFeeChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

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
