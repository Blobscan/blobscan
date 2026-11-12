import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { AvgBlobBaseFeeChart } from "~/components/TimeseriesCharts/AvgBlobBaseFeeChart";
import { AvgBlobBaseFeeUsdChart } from "~/components/TimeseriesCharts/AvgBlobBaseFeeUsdChart";
import { useIsMainnet } from "~/hooks/useIsMainnet";

const AvgBlobBaseFee: NextPage = function () {
  const isMainnet = useIsMainnet();

  return (
    <TimeseriesChartPage
      chart={AvgBlobBaseFeeChart}
      usdChart={isMainnet ? AvgBlobBaseFeeUsdChart : undefined}
      description={(period) =>
        `This chart shows the average blob base fee per ${period}. In USD, each fee is converted at the ETH price of the minute of its block.`
      }
      enableControls={false}
      title="Average Blob Base Fee Stats"
    />
  );
};

export default AvgBlobBaseFee;
