import { useMemo } from "react";
import { type NextPage } from "next";
import NextError from "next/error";

import { DailyBlocksChart } from "~/components/Charts/Block";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { formatDailyBlockStats } from "~/utils";

const BlockStats: NextPage = function () {
  const { data: dailyStatsData, error: dailyStatsError } =
    api.stats.block.getDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallStats, error: overallStatsError } =
    api.stats.block.getOverallStats.useQuery();
  const { days, blocks } = useMemo(
    () => formatDailyBlockStats(dailyStatsData ?? []),
    [dailyStatsData],
  );
  const error = dailyStatsError || overallStatsError;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <StatsLayout
        header="Block Stats"
        metrics={
          overallStats
            ? [
                {
                  name: "Total Blocks",
                  value: overallStats.totalBlocks,
                },
              ]
            : undefined
        }
        charts={[
          {
            name: "Daily Blocks",
            chart: <DailyBlocksChart days={days} blocks={blocks} />,
          },
        ]}
      />
    </>
  );
};

export default BlockStats;
