import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { aggregateDailyBlobStats } from "~/utils/stats";
import { ChartCard } from "~/components/Cards/ChartCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { DailyAvgBlobSize } from "~/components/Charts/Blob/DailyAvgBlobSize";
import { DailyBlobsChart } from "~/components/Charts/Blob/DailyBlobsChart";
import { DailyBlobsSize } from "~/components/Charts/Blob/DailyBlobsSize";
import { Spinner } from "~/components/Spinners/Spinner";

const Stats: NextPage = function () {
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
    <>
      <SectionCard header="Blob Stats"></SectionCard>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>div]:w-full">
        <ChartCard title="Daily Blobs">
          <DailyBlobsChart
            days={days}
            blobs={blobs}
            uniqueBlobs={uniqueBlobs}
          />
        </ChartCard>
        <ChartCard title="Daily Blob Sizes">
          <DailyBlobsSize days={days} blobSizes={blobSizes} />
        </ChartCard>
        <ChartCard title="Daily Average Blob Size">
          <DailyAvgBlobSize days={days} avgBlobSizes={avgBlobSizes} />
        </ChartCard>
      </div>
    </>
  );
};

export default Stats;
