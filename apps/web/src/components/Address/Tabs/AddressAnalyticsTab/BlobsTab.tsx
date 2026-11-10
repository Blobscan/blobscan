import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { getDerivedMetrics } from "../../helpers";
import { SectionLayout } from "./SectionLayout";
import {
  dailyMeanCard,
  peakDayCard,
  roleTotalCards,
  skeletonCards,
} from "./cards";
import type { ChartSpec } from "./charts";
import { LINE_ACCENT_COLOR, pointLine, stackedRoleBars } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The names of the cards. They are also the skeletons while the data loads. */
export const BLOBS_CARD_NAMES = [
  "Total Blobs",
  "Avg. Blobs per Tx",
  "Avg. Daily Blobs",
  "Max Daily Blobs",
];

function buildCards({
  overall,
  timeseries,
  roles,
  mainRole = "sent",
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(BLOBS_CARD_NAMES);
  }

  return [
    ...roleTotalCards(overall, roles, "Total Blobs", "totalBlobs"),
    {
      name: "Avg. Blobs per Tx",
      metric: {
        primary: {
          value: getDerivedMetrics(overall[mainRole]).avgBlobsPerTx,
          numberFormatOpts: { maximumFractionDigits: 2 },
        },
      },
    },
    dailyMeanCard("Avg. Daily Blobs", timeseries, "totalBlobs"),
    peakDayCard("Max Daily Blobs", timeseries, "totalBlobs"),
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
