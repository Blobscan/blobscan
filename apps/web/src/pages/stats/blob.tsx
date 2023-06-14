import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { aggregateDailyBlobStats } from "~/utils/stats";
import { ChartCard } from "~/components/Cards/ChartCard";
import { SectionCard } from "~/components/Cards/SectionCard";
import { DailyBlobsChart } from "~/components/Charts/DailyBlobsChart";
import { Spinner } from "~/components/Spinners/Spinner";

const Stats: NextPage = function () {
  const blobDailyStatsQuery = api.stats.blob.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const blobDailyData = blobDailyStatsQuery.data;

  const { days, blobs, uniqueBlobs } = useMemo(
    () => aggregateDailyBlobStats(blobDailyData ?? []),
    [blobDailyData],
  );

  if (blobDailyStatsQuery.status !== "success") {
    return <Spinner />;
  }

  return (
    <>
      <SectionCard header="Blob Charts"></SectionCard>
      <div className="flex flex-col gap-6 sm:flex-row [&>div]:w-full">
        <ChartCard title="Daily Blobs">
          <DailyBlobsChart
            days={days}
            blobs={blobs}
            uniqueBlobs={uniqueBlobs}
          />
        </ChartCard>
      </div>
    </>
  );
};

export default Stats;
