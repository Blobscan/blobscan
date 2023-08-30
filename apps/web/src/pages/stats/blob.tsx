import type { NextPage } from "next";
import NextError from "next/error";

import {
  DailyAvgBlobSizeChart,
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { formatBytes, parseAmountWithUnit } from "~/utils";

const BlobStats: NextPage = function () {
  const { data: dailyBlobStats, error: dailyBlobStatsErr } =
    api.stats.getBlobDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallBlobStats, error: overallBlobStatsErr } =
    api.stats.getBlobOverallStats.useQuery();

  const error = dailyBlobStatsErr || overallBlobStatsErr;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <StatsLayout
      header="Blob Stats"
      metrics={
        overallBlobStats
          ? [
              {
                name: "Total Blobs",
                metric: { value: overallBlobStats.totalBlobs },
              },
              {
                name: "Total Blob Size",
                metric: {
                  ...parseAmountWithUnit(
                    formatBytes(overallBlobStats.totalBlobSize)
                  ),
                },
              },
              {
                name: "Total Unique Blobs",
                metric: {
                  value: overallBlobStats.totalUniqueBlobs,
                },
              },
              {
                name: "Average Blob Size",
                metric: {
                  ...parseAmountWithUnit(
                    formatBytes(overallBlobStats.avgBlobSize)
                  ),
                },
              },
            ]
          : undefined
      }
      charts={[
        <DailyBlobsChart
          key={0}
          days={dailyBlobStats?.days}
          blobs={dailyBlobStats?.totalBlobs}
          uniqueBlobs={dailyBlobStats?.totalUniqueBlobs}
        />,
        <DailyBlobSizeChart
          key={1}
          days={dailyBlobStats?.days}
          blobSizes={dailyBlobStats?.totalBlobSizes}
        />,
        <DailyAvgBlobSizeChart
          key={2}
          days={dailyBlobStats?.days}
          avgBlobSizes={dailyBlobStats?.avgBlobSizes}
        />,
      ]}
    />
  );
};

export default BlobStats;
