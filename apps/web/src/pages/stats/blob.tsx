import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { aggregateDailyBlobStats } from "~/utils/stats";
import {
  DailyAvgBlobSizeChart,
  DailyBlobSizeChart,
  DailyBlobsChart,
} from "~/components/Charts/Blob/";
import { Spinner } from "~/components/Spinners/Spinner";
import { StatsSection } from "~/components/StatsSection";

const BlobStats: NextPage = function () {
  const blobDailyStatsQuery = api.stats.blob.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const blobDailyData = blobDailyStatsQuery.data;

  const { days, blobs, uniqueBlobs, avgBlobSizes, blobSizes } = useMemo(
    () => aggregateDailyBlobStats(blobDailyData ?? []),
    [blobDailyData],
  );

  if (blobDailyStatsQuery.status !== "success") {
    return <Spinner />;
  }

  return (
    <StatsSection
      header="Blob Stats"
      charts={[
        {
          title: "Daily Blobs",
          element: (
            <DailyBlobsChart
              days={days}
              blobs={blobs}
              uniqueBlobs={uniqueBlobs}
            />
          ),
        },
        {
          title: "Daily Blob Sizes",
          element: <DailyBlobSizeChart days={days} blobSizes={blobSizes} />,
        },
        {
          title: "Daily Average Blob Size",
          element: (
            <DailyAvgBlobSizeChart days={days} avgBlobSizes={avgBlobSizes} />
          ),
        },
      ]}
    />
  );
};

export default BlobStats;
