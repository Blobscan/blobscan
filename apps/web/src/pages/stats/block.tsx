import { type NextPage } from "next";
import NextError from "next/error";

import { DailyBlocksChart } from "~/components/Charts/Block";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import {
  transformDailyBlockStatsResult,
  transformOverallBlockStatsResult,
} from "~/query-transformers";

const BlockStats: NextPage = function () {
  const dailyBlockStatsRes = api.stats.block.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const overallBlockStatsRes = api.stats.block.getOverallStats.useQuery();
  const dailyBlockStats = useTransformResult(
    dailyBlockStatsRes,
    transformDailyBlockStatsResult,
  );
  const blockOverallStats = useTransformResult(
    overallBlockStatsRes,
    transformOverallBlockStatsResult,
  );

  const error = dailyBlockStatsRes.error || overallBlockStatsRes.error;

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
          blockOverallStats
            ? [
                {
                  name: "Total Blocks",
                  value: blockOverallStats.totalBlocks,
                },
              ]
            : undefined
        }
        charts={[
          <DailyBlocksChart
            key={0}
            days={dailyBlockStats?.days}
            blocks={dailyBlockStats?.blocks}
          />,
        ]}
      />
    </>
  );
};

export default BlockStats;
