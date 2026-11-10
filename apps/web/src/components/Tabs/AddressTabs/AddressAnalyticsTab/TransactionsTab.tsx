import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { SectionLayout } from "./SectionLayout";
import type { CardInfo } from "./cards";
import {
  dailyMeanCard,
  peakDayCard,
  roleTotalCards,
  skeletonCards,
} from "./cards";
import type { ChartSpec } from "./charts";
import { stackedRoleBars } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The cards of the section. They are also the skeletons while the data loads. */
const CARDS = {
  total: {
    name: "Total Blob Txs",
    description:
      "Number of blob transactions in the selected time frame, in this role. A transaction the address sends to itself counts in both roles.",
  },
  avgDaily: {
    name: "Avg. Daily Txs",
    description:
      "Mean number of blob transactions per day in the selected time frame, including days without transactions.",
  },
  maxDaily: {
    name: "Max Daily Txs",
    description:
      "Largest number of blob transactions in one UTC day of the selected time frame.",
  },
} satisfies Record<string, CardInfo>;

function buildCards({
  overall,
  timeseries,
  roles,
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(Object.values(CARDS));
  }

  return [
    ...roleTotalCards(overall, roles, CARDS.total, "totalTransactions"),
    dailyMeanCard(CARDS.avgDaily, timeseries, "totalTransactions"),
    peakDayCard(CARDS.maxDaily, timeseries, "totalTransactions"),
  ];
}

const CHARTS: ChartSpec[] = [
  {
    title: "Blob Transactions",
    description:
      "Blob transactions in each period, by role. The line is the mean per period in the selected time frame. The total counts a transaction that the address sends to itself one time.",
    yAxis: { type: "count" },
    series: stackedRoleBars("Txs", "Txs", "avgTxs"),
    // The total is the bars, not the average line. It counts a self-send one
    // time, so it is not the sum of the bars.
    tooltipOpts: {
      displayTotal: true,
      totalStack: "Txs",
      totalColumn: "totalTxs",
      totalLabel: "Total Txs",
    },
    sortSeries: false,
  },
];

export const TransactionsTab: FC<AnalyticsSectionProps> = function (props) {
  return (
    <SectionLayout
      {...props}
      cards={buildCards(props)}
      charts={CHARTS}
      controls={props.timeFrameControl}
    />
  );
};
