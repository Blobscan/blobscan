import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { formatDailyBlockStats } from "~/utils/stats";
import { DailyBlocksChart } from "~/components/Charts/Block";
import { Spinner } from "~/components/Spinners/Spinner";
import { StatsSection } from "~/components/StatsSection";

const BlockStats: NextPage = function () {
  const dailyStatsQuery = api.stats.block.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const overallStatsQuery = api.stats.block.getOverallStats.useQuery();

  const dailyData = dailyStatsQuery.data;
  const { days, blocks } = useMemo(
    () => formatDailyBlockStats(dailyData ?? []),
    [dailyData],
  );

  if (
    dailyStatsQuery.status !== "success" ||
    overallStatsQuery.status !== "success"
  ) {
    return <Spinner />;
  }

  const overallStats = overallStatsQuery.data;

  return (
    <>
      <StatsSection
        header="Block Stats"
        metrics={[
          {
            name: "Total Blocks",
            value: overallStats?.totalBlocks,
          },
        ]}
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
