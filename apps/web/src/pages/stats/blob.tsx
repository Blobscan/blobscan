import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import {
  DailyAvgBlobSizeChart,
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { Spinner } from "~/components/Spinners/Spinner";
import { bytesToKilobytes, formatDailyBlobStats } from "~/utils";

const BlobStats: NextPage = function () {
  const dailyStatsQuery = api.stats.blob.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const overallStatsQuery = api.stats.blob.getOverallStats.useQuery();
  const { days, blobs, uniqueBlobs, avgBlobSizes, blobSizes } = useMemo(
    () => formatDailyBlobStats(dailyStatsQuery.data ?? []),
    [dailyStatsQuery.data],
  );

  if (
    dailyStatsQuery.status !== "success" ||
    overallStatsQuery.status !== "success"
  ) {
    return <Spinner />;
  }

  const overallStats = overallStatsQuery.data;

  return (
    <StatsLayout
      header="Blob Stats"
      metrics={[
        { name: "Total Blobs", value: overallStats.totalBlobs },
        {
          name: "Total Blob Size",
          value: bytesToKilobytes(overallStats.totalBlobSize),
          unit: "KB",
        },
        {
          name: "Total Unique Blobs",
          value: overallStats.totalUniqueBlobs,
        },
        {
          name: "Average Blob Size",
          value: Number(bytesToKilobytes(overallStats.avgBlobSize).toFixed(2)),
          unit: "KB",
        },
      ]}
      charts={[
        {
          name: "Daily Blobs",
          chart: (
            <DailyBlobsChart
              days={days}
              blobs={blobs}
              uniqueBlobs={uniqueBlobs}
            />
          ),
        },
        {
          name: "Daily Blob Sizes",
          chart: <DailyBlobSizeChart days={days} blobSizes={blobSizes} />,
        },
        {
          name: "Daily Average Blob Size",
          chart: (
            <DailyAvgBlobSizeChart days={days} avgBlobSizes={avgBlobSizes} />
          ),
        },
      ]}
    />
  );
};

export default BlobStats;
