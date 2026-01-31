import type { NextPage } from "next";

import { TotalBlocksChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";

const TotalBlocks: NextPage = function () {
  const { data: totalBlocksDataset } = api.stats.getTimeseries.useQuery(
    {
      sort: "asc",
      metrics: "totalBlocks",
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
      title="Total Blocks Stats"
      description="This chart shows the total amount of blocks containing blob transactions per day."
      chart={<TotalBlocksChart size="2xl" dataset={totalBlocksDataset} />}
    />
  );
};

export default TotalBlocks;
