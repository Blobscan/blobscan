import type { NextPage } from "next";

import {
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";

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
                  value: overallBlobStats.totalBlobSize
                    ? BigInt(overallBlobStats.totalBlobSize)
                    : undefined,
                  type: "bytes",
                },
              },
              {
                name: "Total Unique Blobs",
                metric: {
                  value: overallBlobStats.totalUniqueBlobs,
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
      ]}
    />
  );
};

export default BlobStats;
