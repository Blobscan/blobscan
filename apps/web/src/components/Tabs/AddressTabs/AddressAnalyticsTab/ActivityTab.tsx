import type { FC } from "react";
import { useMemo } from "react";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { CalendarHeatmap } from "~/components/Charts/CalendarHeatmap";
import { api } from "~/api-client";
import { formatNumber } from "~/utils";
import type { CardInfo } from "./cards";
import { skeletonCards } from "./cards";
import type {
  AddressOverall,
  AddressTimeseries,
  AnalyticsSectionProps,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** A day with blob txs, as an item of the calendar heatmap. */
type ActivityDay = {
  /** The UTC day, as YYYY-MM-DD. */
  date: string;
  sent: number;
  received: number;
  /** The txs of both roles. */
  value: number;
  /** True when the day is in the longest streak of the address. */
  highlighted: boolean;
};

/**
 * Returns the days with blob txs of a daily timeseries, in order. The days of
 * the longest run of consecutive active days are highlighted. When two runs
 * have the same length, the most recent one is highlighted.
 */
function getActivityDays(data: AddressTimeseries): ActivityDay[] {
  const days: ActivityDay[] = data.timestamps.flatMap((timestamp, i) => {
    const sent = data.sent.totalTransactions[i] ?? 0;
    const received = data.received.totalTransactions[i] ?? 0;

    return sent || received
      ? [
          {
            date: new Date(timestamp).toISOString().slice(0, 10),
            sent,
            received,
            value: sent + received,
            highlighted: false,
          },
        ]
      : [];
  });

  let best: ActivityDay[] = [];
  let run: ActivityDay[] = [];

  days.forEach((day, i) => {
    const prev = days[i - 1];
    const isNextDay =
      !!prev && Date.parse(day.date) - Date.parse(prev.date) === DAY_MS;

    run = isNextDay ? [...run, day] : [day];

    if (run.length >= best.length) {
      best = run;
    }
  });

  best.forEach((day) => {
    day.highlighted = true;
  });

  return days;
}

/** The heatmap shows the last 365 days, today included. */
const HEATMAP_DAYS = 365;

/** Returns the first and the last day of the heatmap, as YYYY-MM-DD. */
function getHeatmapRange(): [string, string] {
  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  const start = new Date(today.getTime() - (HEATMAP_DAYS - 1) * DAY_MS);

  return [start.toISOString().slice(0, 10), today.toISOString().slice(0, 10)];
}

function formatTxCount(count: number) {
  return `${formatNumber(count)} ${count === 1 ? "tx" : "txs"}`;
}

function formatDayTooltip(date: string, day?: ActivityDay) {
  const label = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  if (!day) {
    return `<b>${label}</b><br/>No blob txs`;
  }

  const parts = [
    day.sent ? `${formatNumber(day.sent)} sent` : "",
    day.received ? `${formatNumber(day.received)} received` : "",
  ].filter(Boolean);

  return `<b>${label}</b><br/>${formatNumber(day.value)} blob ${
    day.value === 1 ? "tx" : "txs"
  } (${parts.join(", ")})${
    day.highlighted ? "<br/>In the longest streak" : ""
  }`;
}

/**
 * The cards of the section. They are also the skeletons while the data loads.
 * They use the data of all the time.
 */
const CARDS = {
  age: {
    name: "Age",
    description:
      "Number of days since the first blob transaction of the address.",
  },
  timeActive: {
    name: "Time Active",
    description:
      "Number of UTC days with at least one blob transaction, sent or received.",
  },
  longestStreak: {
    name: "Longest Streak",
    description:
      "Largest number of consecutive UTC days with at least one blob transaction.",
  },
  longestGap: {
    name: "Longest Gap",
    description:
      "Largest number of days without blob transactions between two active days.",
  },
} satisfies Record<string, CardInfo>;

function buildActivityCards(
  allTime?: AddressOverall["allTime"]
): MetricCardProps[] {
  if (!allTime) {
    return skeletonCards(Object.values(CARDS));
  }

  const { firstTransaction, activeDays, longestStreak, longestGap } = allTime;

  return [
    {
      ...CARDS.age,
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
      ...CARDS.timeActive,
      metric: { primary: { value: activeDays, type: "days" } },
    },
    {
      ...CARDS.longestStreak,
      metric: { primary: { value: longestStreak, type: "days" } },
    },
    // MetricCard shows a skeleton for an undefined value, so an address with
    // fewer than two active days shows 0.
    {
      ...CARDS.longestGap,
      metric: { primary: { value: longestGap, type: "days" } },
    },
  ];
}

/**
 * The activity of the address for all the time: the metric cards and a
 * calendar heatmap of the daily txs. The time frame does not change them.
 */
export const ActivityTab: FC<AnalyticsSectionProps> = function ({
  address,
  allTimeOverall,
  enabled,
}) {
  const allTime = allTimeOverall?.allTime;
  const timeseries = api.address.getTimeseries.useQuery(
    { address, timeFrame: "All" },
    { enabled, refetchOnWindowFocus: false }
  );
  // The longest streak comes from all the days, also the days that the
  // heatmap does not show.
  const activityDays = useMemo(
    () => (timeseries.data ? getActivityDays(timeseries.data.data) : undefined),
    [timeseries.data]
  );
  const heatmapRange = useMemo(getHeatmapRange, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {buildActivityCards(allTime).map((card) => (
          <MetricCard key={card.name} {...card} />
        ))}
      </div>
      <Card>
        <CalendarHeatmap
          title="Daily Blob Txs"
          description="Blob transactions in each UTC day of the last 365 days, sent or received. A darker cell has more transactions, and an outline marks the longest streak. Drag the handles of the color bar to show only some values."
          data={activityDays}
          range={heatmapRange}
          highlightLabel="Longest streak"
          formatValue={formatTxCount}
          formatTooltip={formatDayTooltip}
          emptyMessage="This address has no blob transactions."
          isLoading={timeseries.isLoading}
        />
      </Card>
    </div>
  );
};
