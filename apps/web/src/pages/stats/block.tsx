import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { aggregateDailyBlockStats } from "~/utils/stats";
import { DailyBlocksChart } from "~/components/Charts/Block";
import { Spinner } from "~/components/Spinners/Spinner";
import { StatsSection } from "~/components/StatsSection";

const BlockStats: NextPage = function () {
  const blockDailyStatsQuery = api.stats.block.getDailyStats.useQuery({
    timeFrame: "30d",
  });

  const blockDailyData = blockDailyStatsQuery.data;
  const { days, blocks } = useMemo(
    () => aggregateDailyBlockStats(blockDailyData ?? []),
    [blockDailyData],
  );

  if (blockDailyStatsQuery.status !== "success") {
    return <Spinner />;
  }

  return (
    <>
      <StatsSection
        header="Block Stats"
        charts={[
          {
            title: "Daily Blocks",
            element: <DailyBlocksChart days={days} blocks={blocks} />,
          },
        ]}
      />
    </>
  );
};

export default BlockStats;
