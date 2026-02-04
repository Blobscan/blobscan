import type { NextPage } from "next";

import { TotalUniqueAddressesChart } from "~/components/Charts";
import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";

const TotalUniqueAddresses: NextPage = function () {
  return (
    <TimeseriesChartPage
      chart={TotalUniqueAddressesChart}
      description="This chart shows the total unique addresses that have received or sent a blob transaction per day."
      title="Total Unique Addresses"
    />
  );
};

export default TotalUniqueAddresses;
