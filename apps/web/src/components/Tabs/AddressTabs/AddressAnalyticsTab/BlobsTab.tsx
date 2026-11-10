import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { SectionLayout } from "./SectionLayout";
import type { CardInfo } from "./helpers/cards";
import {
  dailyMeanCard,
  peakDayCard,
  roleTotalCards,
  skeletonCards,
} from "./helpers/cards";
import type { ChartSpec } from "./helpers/charts";
import {
  LINE_ACCENT_COLOR,
  pointLine,
  stackedRoleBars,
} from "./helpers/charts";
import { getDerivedMetrics } from "./helpers/metrics";
import type { AnalyticsSectionProps } from "./types";

/** The cards of the section. They are also the skeletons while the data loads. */
const CARDS = {
  total: {
    name: "Total Blobs",
    description:
      "Number of blobs in the transactions of the selected time frame, in this role. Each blob uses 131,072 units of blob gas.",
  },
  avgPerTx: {
    name: "Avg. Blobs per Tx",
    description: "Mean number of blobs in each blob transaction.",
  },
  avgDaily: {
    name: "Avg. Daily Blobs",
    description:
      "Mean number of blobs per day in the selected time frame, including days without transactions.",
  },
  maxDaily: {
    name: "Max Daily Blobs",
    description:
      "Largest number of blobs in one UTC day of the selected time frame.",
  },
} satisfies Record<string, CardInfo>;

function buildCards({
  overall,
  timeseries,
  roles,
  mainRole = "sent",
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(Object.values(CARDS));
  }

  return [
    ...roleTotalCards(overall, roles, CARDS.total, "totalBlobs"),
    {
      ...CARDS.avgPerTx,
      metric: {
        primary: {
          value: getDerivedMetrics(overall[mainRole]).avgBlobsPerTx,
          numberFormatOpts: { maximumFractionDigits: 2 },
        },
      },
    },
    dailyMeanCard(CARDS.avgDaily, timeseries, "totalBlobs"),
    peakDayCard(CARDS.maxDaily, timeseries, "totalBlobs"),
  ];
}

const CHARTS: ChartSpec[] = [
  {
    title: "Blobs",
    description:
      "Blobs in each period, by role. The dashed line is the mean per period. The other line, on the right axis, is the mean number of blobs per transaction in each period.",
    yAxis: { type: "count" },
    y2Axis: { type: "average" },
    // The blobs per tx line is first in the tooltip and the legend, which show
    // the series in reverse order.
    series: (roles, theme, granularity) => [
      ...stackedRoleBars("Blobs", "Blobs", "avgBlobs")(
        roles,
        theme,
        granularity
      ),
      pointLine("Avg. Blobs per Tx", "blobsPerTx", LINE_ACCENT_COLOR[theme], {
        yAxisIndex: 1,
      }),
    ],
    tooltipOpts: {
      displayTotal: true,
      totalStack: "Blobs",
      totalColumn: "totalBlobs",
      totalLabel: "Total Blobs",
    },
    sortSeries: false,
  },
];

export const BlobsTab: FC<AnalyticsSectionProps> = function (props) {
  return (
    <SectionLayout
      {...props}
      cards={buildCards(props)}
      charts={CHARTS}
      controls={props.timeFrameControl}
    />
  );
};
