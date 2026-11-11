import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { EthPriceChart } from "~/components/TimeseriesCharts/EthPriceChart";

const EthPrice: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={EthPriceChart}
      description={(period) =>
        `This chart shows the maximum, average and minimum ETH price in USD per ${period}.`
      }
      title="ETH Price"
    />
  );
};

export default EthPrice;
