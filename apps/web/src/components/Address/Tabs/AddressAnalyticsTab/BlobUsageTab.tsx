import type { FC } from "react";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { formatBytes, formatNumber } from "~/utils";
import type { RoleTotals } from "../../helpers";
import { BLOB_SIZE } from "../../helpers";
import { SectionLayout } from "./SectionLayout";
import { dailyMeanCard, peakDayCard, skeletonCards } from "./cards";
import type { ChartSpec } from "./charts";
import { LINE_ACCENT_COLOR, pointLine, ROLE_COLORS } from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The names of the cards. They are also the skeletons while the data loads. */
export const BLOB_USAGE_CARD_NAMES = [
  "Blob Space Utilization",
  "Avg. Data per Tx",
  "Avg. Daily Data",
  "Max Daily Data",
];

// The colors of the used and the unused space are the same as PercentageBar,
// which shows the blob usage on the details pages.
const USED_COLOR = "bg-primary-700 dark:bg-primary-500";
const UNUSED_COLOR = "bg-primary-200 dark:bg-primary-800";

/**
 * Returns the card with the share of the blob space that has data, and a bar
 * that divides the space into the used and the unused part. It uses the full
 * width of the grid.
 */
function blobSpaceCard(totals?: RoleTotals): MetricCardProps {
  const name = "Blob Space Utilization";
  const className = "col-span-full";

  if (!totals) {
    // Without a value, the card shows the skeletons of the value and the bar.
    return {
      name,
      className,
      metric: { primary: {} },
      breakdown: { ariaLabel: "", parts: [] },
    };
  }

  const used = BigInt(totals.totalBlobUsageSize);
  const total = BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE);
  const unused = total - used;
  // Keep 4 decimal places of the percentage with integer division.
  const usedPercentage = total
    ? Number((used * BigInt(1_000_000)) / total) / 10_000
    : 0;

  return {
    name,
    className,
    metric: {
      primary: {
        value: usedPercentage,
        type: "percentage",
        numberFormatOpts: { maximumFractionDigits: 1 },
      },
    },
    // The total is the space that the percentage refers to.
    secondaryValue: total
      ? `used of ${formatBytes(total)} (${formatNumber(totals.totalBlobs)} ${
          totals.totalBlobs === 1 ? "blob" : "blobs"
        })`
      : "No blobs in this time frame",
    breakdown: {
      ariaLabel: total
        ? `${formatNumber(usedPercentage, "standard", {
            maximumFractionDigits: 1,
          })}% of the blob space is used`
        : "No blob space",
      parts: [
        {
          label: "Used",
          value: Number(used),
          displayValue: formatBytes(used),
          colorClassName: USED_COLOR,
        },
        {
          label: "Unused",
          value: Number(unused),
          displayValue: formatBytes(unused),
          colorClassName: UNUSED_COLOR,
        },
      ],
    },
  };
}

// The sender fills the blobs, so the sent and the received blobs of an
// address come from different parties. The cards and the chart of this
// section show the main role only.
function buildCards({
  overall,
  timeseries,
  mainRole = "sent",
}: AnalyticsSectionProps): MetricCardProps[] {
  if (!overall) {
    // The skeleton of the Blob Space card also has its bar.
    const [, ...names] = BLOB_USAGE_CARD_NAMES;

    return [blobSpaceCard(), ...skeletonCards(names)];
  }

  const totals = overall[mainRole];

  return [
    blobSpaceCard(totals),
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
  return (
    <SectionLayout
      {...props}
      cards={buildCards(props)}
      charts={CHARTS}
      controls={props.timeFrameControl}
    />
  );
};
