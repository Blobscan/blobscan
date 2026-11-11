import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalBlobBaseFeesChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesChart";
import { TotalBlobBaseFeesUsdChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesUsdChart";
import { useIsMainnet } from "~/hooks/useIsMainnet";

const TotalBlobBaseFees: NextPage = function () {
  const isMainnet = useIsMainnet();

  return (
    <TimeseriesChartPage
      chart={TotalBlobBaseFeesChart}
      usdChart={isMainnet ? TotalBlobBaseFeesUsdChart : undefined}
      description={(period) =>
        `This chart shows the total amount of blob base fees per ${period}, broken down by rollup and category. In USD, each fee is converted at the ETH price of the minute of its block.`
      }
      title="Total Blob Base Fees Stats"
      isCategorizedTimeseries
    />
  );
};

export default TotalBlobBaseFees;
