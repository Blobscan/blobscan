import type { NextPage } from "next";

import { NotFoundErrorView } from "~/components/ErrorViews/NotFoundErrorView";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { EthPriceChart } from "~/components/TimeseriesCharts/EthPriceChart";
import { useHasEthPrice } from "~/hooks/useHasEthPrice";

const EthPrice: NextPage = function () {
  const hasEthPrice = useHasEthPrice();

  if (hasEthPrice === undefined) {
    return null;
  }

  if (!hasEthPrice) {
    return (
      <NotFoundErrorView
        title="Chart Not Available"
        description="This network has no ETH price chart."
      />
    );
  }

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
