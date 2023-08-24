import type { NextPage } from "next";
import NextError from "next/error";

import {
  DailyAvgBlobSizeChart,
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import {
  transformDailyBlobStatsResult,
  transformOverallBlobStatsResult,
} from "~/query-transformers";
import { formatBytes, parseBytes } from "~/utils";

const BlobStats: NextPage = function () {
  const dailyBlobStatsRes = api.stats.blob.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const dailyBlobStats = useTransformResult(
    dailyBlobStatsRes,
    transformDailyBlobStatsResult
  );
  const overallBlobStatsRes = api.stats.blob.getOverallStats.useQuery();
  const overallBlobStats = useTransformResult(
    overallBlobStatsRes,
    transformOverallBlobStatsResult
  );

  const error = dailyBlobStatsRes.error || overallBlobStatsRes.error;

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
              { name: "Total Blobs", value: overallBlobStats.totalBlobs },
              {
                name: "Total Blob Size",
                ...parseBytes(formatBytes(overallBlobStats.totalBlobSize)),
              },
              {
                name: "Total Unique Blobs",
                value: overallBlobStats.totalUniqueBlobs,
              },
              {
                name: "Average Blob Size",
                ...parseBytes(formatBytes(overallBlobStats.avgBlobSize)),
              },
            ]
          : undefined
      }
      charts={[
        <DailyBlobsChart
          key={0}
          days={dailyBlobStats?.days}
          blobs={dailyBlobStats?.blobs}
          uniqueBlobs={dailyBlobStats?.uniqueBlobs}
        />,
        <DailyBlobSizeChart
          key={1}
          days={dailyBlobStats?.days}
          blobSizes={dailyBlobStats?.blobSizes}
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
