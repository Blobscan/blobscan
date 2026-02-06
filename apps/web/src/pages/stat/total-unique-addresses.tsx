import type { NextPage } from "next";

import { TimeseriesChartPage } from "~/components/TimeseriesChartPage";
import { TotalUniqueAddressesChart } from "~/components/TimeseriesCharts";

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
