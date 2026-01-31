import type { NextPage } from "next";

import { TotalBlobGasComparisonChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";

const TotalBlobGasUsedComparison: NextPage = function () {
  const { data: totalBlobGasUsedComparisonDataset } =
    api.stats.getTimeseries.useQuery(
      {
        sort: "asc",
        metrics: "totalBlobGasUsed, totalBlobAsCalldataGasUsed",
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
      title="Total Blob Gas Used Comparison"
      description="This chart compares the daily total blob gas usage with the amount of gas that would have been consumed if the same data were submitted as calldata."
      chart={
        <TotalBlobGasComparisonChart
          size="2xl"
          dataset={totalBlobGasUsedComparisonDataset}
        />
      }
    />
  );
};

export default TotalBlobGasUsedComparison;
