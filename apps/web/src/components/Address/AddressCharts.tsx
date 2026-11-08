import type { FC } from "react";
import { useMemo } from "react";
import type { SeriesOption } from "echarts";
import { useTheme } from "next-themes";

import { ChartBase } from "~/components/Charts/ChartBase";
import type { Axis, ChartBaseProps } from "~/components/Charts/ChartBase";
import type { ChartDataset } from "~/components/Charts/ChartBase/helpers";
import type { FeeUnit } from "~/components/Toggles";
import type { ThemeMode } from "~/types";
import type { AddressRole, AddressSection, AddressTimeseries } from "./helpers";
import {
  BLOB_SIZE,
  getClosedPeriodsMean,
  ROLE_LABELS,
  sumRoles,
} from "./helpers";

type ThemeColor = Record<ThemeMode, string>;

// The colors come from `baseColors` in @blobscan/tailwind-config
// (tooling/tailwind/colors.ts): the primary color for sent, the blue color for
// received. The soft colors show the unused space in the size chart.
const ROLE_COLORS: Record<AddressRole, { main: ThemeColor; soft: ThemeColor }> =
  {
    sent: {
      main: { light: "#5D25D4", dark: "#9A71F2" },
      soft: { light: "#C8AEFA", dark: "#5D25D4" },
    },
    received: {
      main: { light: "#5D88F4", dark: "#5D88F4" },
      soft: { light: "#C9E5FF", dark: "#3B5BA8" },
    },
  };

const NETWORK_LINE_COLOR: ThemeColor = { light: "#A3A3A3", dark: "#7D80AB" };
const AVG_LINE_COLOR: ThemeColor = { light: "#404040", dark: "#E5E5E5" };
// The color of a ratio line on the right y-axis.
const LINE_ACCENT_COLOR: ThemeColor = {
  light: "#D97706",
  dark: "#FBBF24",
};

type Column = (string | number | null)[];

function toWeiColumn(values: bigint[]): Column {
  return values.map((v) => v.toString());
}

/** Returns the dataset that all the address charts use. */
function buildDataset(data: AddressTimeseries): ChartDataset {
  const source: Record<string, Column | Date[]> = {
    timestamp: data.timestamps,
  };

  for (const role of ["sent", "received"] as const) {
    const s = data[role];

    source[`${role}Txs`] = s.totalTransactions;
    source[`${role}Blobs`] = s.totalBlobs;
    source[`${role}Fee`] = toWeiColumn(s.totalBlobBaseFee);
    source[`${role}FeeUsd`] = s.totalBlobBaseFeeUsd;
    source[`${role}Usage`] = s.totalBlobUsageSize.map(Number);
    source[`${role}Unused`] = s.totalBlobs.map(
      (blobs, i) => blobs * BLOB_SIZE - Number(s.totalBlobUsageSize[i] ?? 0)
    );
    source[`${role}CostPerKb`] = s.totalBlobUsageSize.map((usage, i) =>
      usage
        ? (
            (BigInt(s.totalBlobBaseFee[i] ?? 0) * BigInt(1024)) /
            usage
          ).toString()
        : null
    );
    source[`${role}CostPerKbUsd`] = s.totalBlobUsageSize.map((usage, i) => {
      const usd = s.totalBlobBaseFeeUsd[i];

      return usage && usd !== null && usd !== undefined
        ? usd / (Number(usage) / 1024)
        : null;
    });
  }

  // The txs and blobs of each period, sent and received together. A
  // self-send counts one time. The tooltip total and the averages use them.
  const totalTxs = sumRoles(data, "totalTransactions");
  const totalBlobs = sumRoles(data, "totalBlobs");

  source.totalTxs = totalTxs;
  source.totalBlobs = totalBlobs;
  const avgTxs = getClosedPeriodsMean(totalTxs) ?? null;
  const avgBlobs = getClosedPeriodsMean(totalBlobs) ?? null;

  source.avgTxs = data.timestamps.map(() => avgTxs);
  source.avgBlobs = data.timestamps.map(() => avgBlobs);
  // The data bytes of each period of each role, as a percentage of the blob
  // size. A period with no blobs has no value.
  for (const role of ["sent", "received"] as const) {
    source[`${role}Utilization`] = data[role].totalBlobs.map((blobs, i) => {
      const usage = Number(data[role].totalBlobUsageSize[i] ?? 0);

      return blobs ? (usage / (blobs * BLOB_SIZE)) * 100 : null;
    });
  }
  // The blobs per tx of each period, sent and received together. A period
  // with no txs has no value.
  source.blobsPerTx = totalBlobs.map((blobs, i) => {
    const txs = totalTxs[i] ?? 0;

    return txs ? blobs / txs : null;
  });

  // The blobs of each role, as a percentage of all the blobs of the network
  // in the same period.
  for (const role of ["sent", "received"] as const) {
    source[`${role}NetworkShare`] = data[role].totalBlobs.map((blobs, i) => {
      const networkBlobs = data.network.totalBlobs[i] ?? 0;

      return blobs && networkBlobs ? (blobs / networkBlobs) * 100 : null;
    });
  }

  // The price of blob gas that the address paid, divided by the network
  // price in the same period. Both prices are weighted by gas.
  source.sentTimingRatio = data.sent.totalBlobs.map((blobs, i) => {
    const networkGas = Number(data.network.totalBlobGasUsed[i] ?? 0);
    const networkFee = Number(data.network.totalBlobBaseFee[i] ?? 0);

    if (!blobs || !networkGas || !networkFee) {
      return null;
    }

    const addressPrice =
      Number(data.sent.totalBlobBaseFee[i] ?? 0) / (blobs * BLOB_SIZE);

    return addressPrice / (networkFee / networkGas);
  });

  const lastTimestamp = data.timestamps.at(-1);

  return {
    source,
    currentPeriod: lastTimestamp
      ? { timestamp: lastTimestamp, updatedAt: data.updatedAt ?? undefined }
      : undefined,
  } as ChartDataset;
}

type ChartSpec = {
  section: AddressSection;
  title: string;
  /** The help text of the chart. An icon after the title shows it. */
  description: string;
  yAxis: Axis;
  /** A second y-axis on the right, for the series with `yAxisIndex` 1. */
  y2Axis?: Axis;
  series: (
    roles: AddressRole[],
    theme: ThemeMode,
    granularity: AddressTimeseries["granularity"]
  ) => SeriesOption[];
  tooltipOpts?: ChartBaseProps["tooltipOpts"];
  sortSeries?: boolean;
  /**
   * Shows only the main role. The title gets the role, for example
   * "(As Sender)".
   */
  mainRoleOnly?: boolean;
};

const ROLE_TITLE_LABELS: Record<AddressRole, string> = {
  sent: "As Sender",
  received: "As Receiver",
};

function roleBars(column: string) {
  return (roles: AddressRole[], theme: ThemeMode): SeriesOption[] =>
    roles.map((role) => ({
      type: "bar",
      name: ROLE_LABELS[role],
      encode: { x: "timestamp", y: `${role}${column}` },
      itemStyle: { color: ROLE_COLORS[role].main[theme] },
      areaStyle: undefined,
      barGap: "10%",
    }));
}

function roleLines(column: string) {
  return (roles: AddressRole[], theme: ThemeMode): SeriesOption[] =>
    roles.map((role) => ({
      type: "line",
      name: ROLE_LABELS[role],
      encode: { x: "timestamp", y: `${role}${column}` },
      itemStyle: { color: ROLE_COLORS[role].main[theme] },
      areaStyle: undefined,
      // Show the points: a period with no data breaks the line, so a
      // single active period has no line.
      symbolSize: 4,
      smooth: false,
      connectNulls: false,
    }));
}

const PERIOD_LABELS: Record<AddressTimeseries["granularity"], string> = {
  day: "Daily",
  hour: "Hourly",
};

/**
 * Returns one bar for each period, which stacks the sent and the received
 * values, for example "Blobs Sent", and a dashed line with the average of the
 * bars, for example "Avg. Daily Blobs".
 */
function stackedRoleBars(column: string, noun: string, avgColumn: string) {
  return (
    roles: AddressRole[],
    theme: ThemeMode,
    granularity: AddressTimeseries["granularity"]
  ): SeriesOption[] => {
    const color = AVG_LINE_COLOR[theme];
    const avgName = `Avg. ${PERIOD_LABELS[granularity]} ${noun}`;

    // The legend and the tooltip show the series in reverse order: the
    // average, then sent and received. Thus the bars are next to the total
    // at the bottom of the tooltip.
    return [
      ...(["received", "sent"] as const)
        .filter((role) => roles.includes(role))
        .map(
          (role): SeriesOption => ({
            type: "bar",
            name: `${noun} ${ROLE_LABELS[role]}`,
            stack: column,
            encode: { x: "timestamp", y: `${role}${column}` },
            itemStyle: { color: ROLE_COLORS[role].main[theme] },
          })
        ),
      {
        type: "line",
        name: avgName,
        encode: { x: "timestamp", y: avgColumn },
        itemStyle: { color },
        lineStyle: { color, type: "dashed", width: 2 },
        areaStyle: undefined,
        symbol: "none",
        smooth: false,
      },
    ];
  };
}

function getChartSpecs(unit: FeeUnit): ChartSpec[] {
  const isUsd = unit === "usd";
  const feeAxis: Axis = isUsd
    ? { type: "count", unitType: "fiat", unit: "USD" }
    : { type: "count", unitType: "ether", unit: "wei", displayUnit: "Gwei" };
  const avgFeeAxis: Axis = isUsd
    ? { type: "average", unitType: "fiat", unit: "USD" }
    : { type: "average", unitType: "ether", unit: "wei", displayUnit: "Gwei" };

  return [
    {
      section: "transactions",
      title: "Blob Transactions",
      description:
        "Blob transactions in each period, by role. The line is the mean per period in the selected time frame. The total counts a transaction that the address sends to itself one time.",
      yAxis: { type: "count" },
      series: stackedRoleBars("Txs", "Txs", "avgTxs"),
      // The total is the bars, not the average line. It counts a self-send
      // one time, so it is not the sum of the bars.
      tooltipOpts: {
        displayTotal: true,
        totalStack: "Txs",
        totalColumn: "totalTxs",
        totalLabel: "Total Txs",
      },
      sortSeries: false,
    },
    {
      section: "blobs",
      title: "Blobs",
      description:
        "Blobs in each period, by role. The dashed line is the mean per period. The other line, on the right axis, is the mean number of blobs per transaction in each period.",
      yAxis: { type: "count" },
      y2Axis: { type: "average" },
      // The blobs per tx line is first in the tooltip and the legend, which
      // show the series in reverse order.
      series: (roles, theme, granularity) => [
        ...stackedRoleBars("Blobs", "Blobs", "avgBlobs")(
          roles,
          theme,
          granularity
        ),
        {
          type: "line",
          name: "Avg. Blobs per Tx",
          yAxisIndex: 1,
          encode: { x: "timestamp", y: "blobsPerTx" },
          itemStyle: { color: LINE_ACCENT_COLOR[theme] },
          areaStyle: undefined,
          // Show the points: a period with no txs breaks the line.
          symbolSize: 4,
          smooth: false,
          connectNulls: false,
        },
      ],
      tooltipOpts: {
        displayTotal: true,
        totalStack: "Blobs",
        totalColumn: "totalBlobs",
        totalLabel: "Total Blobs",
      },
      sortSeries: false,
    },
    {
      section: "fees",
      title: "Blob Fees",
      description:
        "Blob base fees of the transactions in each period, by role. The blob base fee is the blob gas used multiplied by the blob gas price of the block.",
      yAxis: feeAxis,
      series: roleBars(isUsd ? "FeeUsd" : "Fee"),
      tooltipOpts: { displayTotal: true, totalLabel: "Total Blob Fees" },
    },
    {
      section: "fees",
      title: "Cost per KiB of Blob Data",
      description:
        "Blob fees divided by the size of the blob data in each period, by role. Unused blob space makes this cost higher.",
      yAxis: avgFeeAxis,
      series: roleLines(isUsd ? "CostPerKbUsd" : "CostPerKb"),
    },
    {
      section: "usage",
      title: "Blob Size vs Usage",
      description:
        "Blob space in each period, divided into data and unused space. The line, on the right axis, is the percentage of the blob space that has data. The chart shows only the role with more transactions.",
      yAxis: { type: "count", unitType: "byte", unit: "B" },
      y2Axis: { type: "average" },
      // The sender fills the blobs, so the sent and the received blobs of an
      // address come from different parties. The chart shows the main role
      // only, as the Blob Space card and the cards of the section.
      mainRoleOnly: true,
      // The data is at the bottom of each bar. The legend and the tooltip
      // show the series in reverse order: the utilization line, the unused
      // space, then the data.
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
        {
          type: "line",
          name: "Utilization (%)",
          yAxisIndex: 1,
          encode: { x: "timestamp", y: `${role}Utilization` },
          itemStyle: { color: LINE_ACCENT_COLOR[theme] },
          areaStyle: undefined,
          // Show the points: a period with no blobs breaks the line.
          symbolSize: 4,
          smooth: false,
          connectNulls: false,
        },
      ],
      // The total is the blob space: the data and the unused space.
      tooltipOpts: {
        displayTotal: true,
        totalStack: "usage",
        totalLabel: "Total Blob Space",
      },
      sortSeries: false,
    },
    {
      section: "network",
      title: "Share of Network Blobs (%)",
      description:
        "Blobs of the address in each period, by role, as a percentage of all the blobs of the network in the same period.",
      yAxis: { type: "average" },
      series: roleLines("NetworkShare"),
    },
    {
      section: "network",
      title: "Timing Ratio vs Network",
      description:
        "Blob gas price that the address paid in each period, divided by the mean price of the network in the same period. Below 1, the address paid less than the network. Only sent transactions pay blob fees.",
      yAxis: { type: "average" },
      series: (roles, theme) =>
        roles.includes("sent")
          ? [
              {
                type: "line",
                name: ROLE_LABELS.sent,
                encode: { x: "timestamp", y: "sentTimingRatio" },
                itemStyle: { color: ROLE_COLORS.sent.main[theme] },
                areaStyle: undefined,
                // Show the points: a period with no data breaks the line, so a
                // single active period has no line.
                symbolSize: 4,
                smooth: false,
                markLine: {
                  silent: true,
                  symbol: "none",
                  label: { formatter: "Network", position: "insideEndTop" },
                  lineStyle: {
                    color: NETWORK_LINE_COLOR[theme],
                    type: "dashed",
                  },
                  data: [{ yAxis: 1 }],
                },
              },
            ]
          : [],
    },
  ];
}

export type AddressChartsProps = {
  section: AddressSection;
  data?: AddressTimeseries;
  roles: AddressRole[];
  /** The role with more transactions. Some charts show only this role. */
  mainRole?: AddressRole;
  unit: FeeUnit;
  isLoading?: boolean;
};

export const AddressCharts: FC<AddressChartsProps> = function ({
  section,
  data,
  roles,
  mainRole = "sent",
  unit,
  isLoading,
}) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "light") as ThemeMode;
  const dataset = useMemo(
    () => (data ? buildDataset(data) : undefined),
    [data]
  );
  const specs = useMemo(
    () => getChartSpecs(unit).filter((spec) => spec.section === section),
    [unit, section]
  );

  return (
    <div className="flex flex-col gap-14">
      {specs.map(
        ({
          title,
          description,
          yAxis,
          y2Axis,
          series,
          tooltipOpts,
          sortSeries,
          mainRoleOnly,
        }) => (
          <ChartBase
            key={title}
            title={
              mainRoleOnly ? `${title} (${ROLE_TITLE_LABELS[mainRole]})` : title
            }
            description={description}
            isLoading={isLoading}
            dataset={dataset}
            series={series(
              mainRoleOnly ? [mainRole] : roles,
              theme,
              data?.granularity ?? "day"
            )}
            axes={{
              x: { type: "time", granularity: data?.granularity },
              y: yAxis,
              y2: y2Axis,
            }}
            tooltipOpts={tooltipOpts}
            sortSeries={sortSeries}
            legendPosition="bottom"
            size="xl"
            skeletonOpts={{ chart: { variant: "bar" } }}
          />
        )
      )}
    </div>
  );
};
