import type { FC } from "react";
import { useMemo } from "react";
import type { SeriesOption } from "echarts";
import { useTheme } from "next-themes";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { Axis, ChartBaseProps } from "~/components/Charts/ChartBase";
import type { ChartDataset } from "~/components/Charts/ChartBase/helpers";
import type { FeeUnit } from "~/components/Toggles";
import type { ThemeMode } from "~/types";
import type { AddressRole, AddressTimeseries } from "./helpers";
import { BLOB_SIZE, ROLE_LABELS } from "./helpers";

type ThemeColor = Record<ThemeMode, string>;

// The colors come from `baseColors` in @blobscan/tailwind-config
// (tooling/tailwind/colors.ts): the primary color for sent, the blue color for
// received. The soft colors show the padding in the size chart.
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
    source[`${role}Padding`] = s.totalBlobs.map(
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
  title: string;
  yAxis: Axis;
  series: (roles: AddressRole[], theme: ThemeMode) => SeriesOption[];
  tooltipOpts?: ChartBaseProps["tooltipOpts"];
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
      title: "Blob Transactions",
      yAxis: { type: "count" },
      series: roleBars("Txs"),
    },
    {
      title: "Blobs",
      yAxis: { type: "count" },
      series: roleBars("Blobs"),
    },
    {
      title: "Blob Fees",
      yAxis: feeAxis,
      series: roleBars(isUsd ? "FeeUsd" : "Fee"),
    },
    {
      title: "Cost per KiB of Data",
      yAxis: avgFeeAxis,
      series: roleLines(isUsd ? "CostPerKbUsd" : "CostPerKb"),
    },
    {
      title: "Blob Size vs Usage",
      yAxis: { type: "count", unitType: "byte", unit: "B" },
      series: (roles, theme) =>
        roles.flatMap((role) => [
          {
            type: "bar",
            name: `${ROLE_LABELS[role]} · data`,
            stack: role,
            encode: { x: "timestamp", y: `${role}Usage` },
            itemStyle: { color: ROLE_COLORS[role].main[theme] },
            areaStyle: undefined,
          },
          {
            type: "bar",
            name: `${ROLE_LABELS[role]} · padding`,
            stack: role,
            encode: { x: "timestamp", y: `${role}Padding` },
            itemStyle: { color: ROLE_COLORS[role].soft[theme] },
            areaStyle: undefined,
          },
        ]),
    },
    {
      title: "Timing Ratio vs Network (Sent)",
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
  data?: AddressTimeseries;
  roles: AddressRole[];
  unit: FeeUnit;
  isLoading?: boolean;
};

export const AddressCharts: FC<AddressChartsProps> = function ({
  data,
  roles,
  unit,
  isLoading,
}) {
  const { resolvedTheme } = useTheme();
  const theme = (resolvedTheme ?? "light") as ThemeMode;
  const dataset = useMemo(
    () => (data ? buildDataset(data) : undefined),
    [data]
  );
  const specs = useMemo(() => getChartSpecs(unit), [unit]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {specs.map(({ title, yAxis, series, tooltipOpts }) => (
        <ChartCard
          key={title}
          title={title}
          size="md"
          isLoading={isLoading}
          dataset={dataset}
          series={series(roles, theme)}
          axes={{
            x: { type: "time", granularity: data?.granularity },
            y: yAxis,
          }}
          tooltipOpts={tooltipOpts}
          skeletonOpts={{ chart: { variant: "bar" } }}
        />
      ))}
    </div>
  );
};
