import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { BlobGasPriceChart } from "~/components/TimeseriesCharts/BlobGasPriceChart";

const BlobGasPrice: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={BlobGasPriceChart}
      description={(period) =>
        `This chart shows the maximum, average and minimum blob gas price per ${period}.`
      }
      title="Blob Gas Price"
    />
  );
};

export default BlobGasPrice;
