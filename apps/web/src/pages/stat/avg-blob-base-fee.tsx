import type { NextPage } from "next";

import { AvgBlobBaseFeeChart } from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { StatPageLayout } from "~/components/Layouts/StatPageLayout";
import { api } from "~/api-client";

const AvgBlobBaseFee: NextPage = function () {
  const { data: avgBlobBaseFeeDatasets } = api.stats.getTimeseries.useQuery(
    {
      sort: "asc",
      metrics: "avgBlobFee",
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
      title="Average Blob Base Fee Stats"
      description="This chart shows the average blob base fee per day."
      chart={
        <AvgBlobBaseFeeChart size="2xl" dataset={avgBlobBaseFeeDatasets} />
      }
    />
  );
};

export default AvgBlobBaseFee;
