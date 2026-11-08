import type { FC } from "react";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { api } from "~/api-client";
import { ActivityHeatmap } from "./ActivityHeatmap";
import type { AddressOverall } from "./helpers";
import { getMetricDescription } from "./metric-descriptions";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The names of the cards. They are also the skeletons while the data loads. */
export const ACTIVITY_METRIC_NAMES = [
  "Age",
  "Time Active",
  "Longest Streak",
  "Longest Gap",
];

function buildActivityCards(
  allTime?: AddressOverall["allTime"]
): MetricCardProps[] {
  if (!allTime) {
    return ACTIVITY_METRIC_NAMES.map((name) => ({ name }));
  }

  const { firstTransaction, activeDays, longestStreak, longestGap } = allTime;
  const [ageName, activeDaysName, streakName, gapName] = ACTIVITY_METRIC_NAMES;

  return [
    {
      name: ageName,
      metric: {
        primary: {
          value: firstTransaction
            ? Math.floor(
                (Date.now() - firstTransaction.blockTimestamp.getTime()) /
                  DAY_MS
              )
            : 0,
          type: "days",
        },
      },
    },
    {
      name: activeDaysName,
      metric: { primary: { value: activeDays, type: "days" } },
    },
    {
      name: streakName,
      metric: { primary: { value: longestStreak, type: "days" } },
    },
    // MetricCard shows a skeleton for an undefined value, so an address with
    // fewer than two active days shows 0.
    {
      name: gapName,
      metric: { primary: { value: longestGap, type: "days" } },
    },
  ];
}

export type AddressActivityProps = {
  address: string;
  /** The all-time values of the overall query. */
  allTime?: AddressOverall["allTime"];
  enabled: boolean;
};

/**
 * The activity of the address for all the time: the metric cards and a
 * calendar heatmap of the daily txs. The time frame does not change them.
 */
export const AddressActivity: FC<AddressActivityProps> = function ({
  address,
  allTime,
  enabled,
}) {
  const timeseries = api.address.getTimeseries.useQuery(
    { address, timeFrame: "All" },
    { enabled, refetchOnWindowFocus: false }
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {buildActivityCards(allTime).map((card) => (
          <MetricCard
            key={card.name}
            description={getMetricDescription(card.name)}
            {...card}
          />
        ))}
      </div>
      <Card>
        <ActivityHeatmap
          data={timeseries.data?.data}
          isLoading={timeseries.isLoading}
        />
      </Card>
    </div>
  );
};
