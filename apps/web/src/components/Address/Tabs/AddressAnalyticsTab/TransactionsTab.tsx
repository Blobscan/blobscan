import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { SectionLayout } from "./SectionLayout";
import {
  dailyMeanCard,
  peakDayCard,
  roleTotalCards,
  skeletonCards,
} from "./cards";
import type { ChartSpec } from "./charts";
import { stackedRoleBars } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The names of the cards. They are also the skeletons while the data loads. */
export const TRANSACTIONS_CARD_NAMES = [
  "Total Blob Txs",
  "Avg. Daily Txs",
  "Max Daily Txs",
];

function buildCards({
  overall,
  timeseries,
  roles,
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(TRANSACTIONS_CARD_NAMES);
  }

  return [
    ...roleTotalCards(overall, roles, "Total Blob Txs", "totalTransactions"),
    dailyMeanCard("Avg. Daily Txs", timeseries, "totalTransactions"),
    peakDayCard("Max Daily Txs", timeseries, "totalTransactions"),
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
