import { useMemo } from "react";
import { type NextPage } from "next";
import NextError from "next/error";

import {
  DailyAvgBlobSizeChart,
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { bytesToKilobytes, formatDailyBlobStats } from "~/utils";

const BlobStats: NextPage = function () {
  const {
    data: dailyStatsData,
    error: dailyStatsError,
    isLoading,
  } = api.stats.blob.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const {
    data: overallStats,
    error: overallStatsError,
    isLoading: loading,
  } = api.stats.blob.getOverallStats.useQuery();
  const dailyStats = useMemo(
    () => (dailyStatsData ? formatDailyBlobStats(dailyStatsData) : undefined),
    [dailyStatsData],
  );
  const error = overallStatsError || dailyStatsError;

  console.log("daily Loading ", isLoading);
  console.log("overall Loading ", loading);
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
        overallStats
          ? [
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
                value: Number(
                  bytesToKilobytes(overallStats.avgBlobSize).toFixed(2),
                ),
                unit: "KB",
              },
            ]
          : undefined
      }
      charts={
        dailyStats
          ? [
              {
                name: "Daily Blobs",
                chart: (
                  <DailyBlobsChart
                    days={dailyStats.days}
                    blobs={dailyStats.blobs}
                    uniqueBlobs={dailyStats.uniqueBlobs}
                  />
                ),
              },
              {
                name: "Daily Blob Sizes",
                chart: (
                  <DailyBlobSizeChart
                    days={dailyStats.days}
                    blobSizes={dailyStats.blobSizes}
                  />
                ),
              },
              {
                name: "Daily Average Blob Size",
                chart: (
                  <DailyAvgBlobSizeChart
                    days={dailyStats.days}
                    avgBlobSizes={dailyStats.avgBlobSizes}
                  />
                ),
              },
            ]
          : undefined
      }
    />
  );
};

export default BlobStats;
