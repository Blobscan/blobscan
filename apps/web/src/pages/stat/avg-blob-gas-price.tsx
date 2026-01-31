import type { NextPage } from "next";

import { AvgBlobGasPriceChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";

const AvgBlobGasPrice: NextPage = function () {
  const { data: avgBlobGasPriceDataset } = api.stats.getTimeseries.useQuery(
    {
      sort: "asc",
      metrics: "avgBlobGasPrice",
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: ({ data }) => transformToDatasets(data)[0],
    }
  );

  return (
    <StatPageLayout
      title="Average Blob Gas Price"
      description="This chart shows the average blob gas price per day."
      chart={
        <AvgBlobGasPriceChart size="2xl" dataset={avgBlobGasPriceDataset} />
      }
    />
  );
};

export default AvgBlobGasPrice;
