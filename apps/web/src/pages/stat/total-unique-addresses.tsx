import type { NextPage } from "next";

import { TotalUniqueAddressesChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";

const TotalUniqueAddresses: NextPage = function () {
  const { data: dailyBlobsDatasets } = api.stats.getTimeseries.useQuery(
    {
      sort: "asc",
      metrics: "totalUniqueReceivers, totalUniqueSenders",
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
      title="Total Unique Addresses"
      description="This chart shows the total unique addresses that have received or sent a blob transaction per day."
      chart={
        <TotalUniqueAddressesChart size="2xl" dataset={dailyBlobsDatasets} />
      }
    />
  );
};

export default TotalUniqueAddresses;
