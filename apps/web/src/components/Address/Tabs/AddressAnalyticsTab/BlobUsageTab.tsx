import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { BLOB_SIZE } from "../../helpers";
import { BlobSpaceCard } from "./BlobSpaceCard";
import { SectionLayout } from "./SectionLayout";
import { dailyMeanCard, peakDayCard, skeletonCards } from "./cards";
import type { ChartSpec } from "./charts";
import { LINE_ACCENT_COLOR, pointLine, ROLE_COLORS } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/**
 * The names of the cards. They are also the skeletons while the data loads.
 * The Blob Space card, before these cards, shows the utilization and the used
 * and the unused space.
 */
export const BLOB_USAGE_CARD_NAMES = [
  "Avg. Data per Tx",
  "Avg. Daily Data",
  "Max Daily Data",
];

// The sender fills the blobs, so the sent and the received blobs of an
// address come from different parties. The cards and the chart of this
// section show the main role only.
function buildCards({
  overall,
  timeseries,
  mainRole = "sent",
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    return skeletonCards(BLOB_USAGE_CARD_NAMES);
  }

  const totals = overall[mainRole];

  return [
    {
      name: "Avg. Data per Tx",
      metric: {
        primary: {
          value: totals.totalTransactions
            ? Number(totals.totalBlobUsageSize) / totals.totalTransactions
            : undefined,
          type: "bytes",
        },
      },
    },
    dailyMeanCard("Avg. Daily Data", timeseries, "totalBlobUsageSize", {
      type: "bytes",
      role: mainRole,
    }),
    peakDayCard("Max Daily Data", timeseries, "totalBlobUsageSize", {
      type: "bytes",
      role: mainRole,
    }),
  ];
}

const CHARTS: ChartSpec[] = [
  {
    title: "Blob Size vs Usage",
    description:
      "Blob space in each period, divided into data and unused space. The line, on the right axis, is the percentage of the blob space that has data. The chart shows only the role with more transactions.",
    yAxis: { type: "count", unitType: "byte", unit: "B" },
    y2Axis: { type: "average" },
    mainRoleOnly: true,
    // The data is at the bottom of each bar. The legend and the tooltip show
    // the series in reverse order: the utilization line, the unused space,
    // then the data.
    series: ([role = "sent"], theme) => [
      {
        type: "bar",
        name: "Data",
        stack: "usage",
        encode: { x: "timestamp", y: `${role}Usage` },
        itemStyle: { color: ROLE_COLORS[role].main[theme] },
      },
      {
        type: "bar",
        name: "Unused",
        stack: "usage",
        encode: { x: "timestamp", y: `${role}Unused` },
        itemStyle: { color: ROLE_COLORS[role].soft[theme] },
      },
      pointLine(
        "Utilization (%)",
        `${role}Utilization`,
        LINE_ACCENT_COLOR[theme],
        { yAxisIndex: 1 }
      ),
    ],
    // The total is the blob space: the data and the unused space.
    tooltipOpts: {
      displayTotal: true,
      totalStack: "usage",
      totalLabel: "Total Blob Space",
    },
    sortSeries: false,
  },
];

export const BlobUsageTab: FC<AnalyticsSectionProps> = function (props) {
  const { overall, mainRole = "sent" } = props;
  const totals = overall?.[mainRole];

  return (
    <SectionLayout
      {...props}
      header={
        <BlobSpaceCard
          className="col-span-full"
          usedSize={totals ? BigInt(totals.totalBlobUsageSize) : undefined}
          totalSize={
            totals ? BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE) : undefined
          }
          totalBlobs={totals?.totalBlobs}
        />
      }
      cards={buildCards(props)}
      charts={CHARTS}
      controls={props.timeFrameControl}
    />
  );
};
