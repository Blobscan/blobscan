import type { LineSeriesOption, SeriesOption } from "echarts";

import type { Axis, ChartBaseProps } from "~/components/Charts/ChartBase";
import type { ChartDataset } from "~/components/Charts/ChartBase/helpers";
import type { FeeUnit } from "~/components/Toggles";
import type { ThemeMode } from "~/types";
import type { AddressRole, AddressTimeseries } from "../types";
import { BLOB_SIZE } from "./metrics";
import { ROLE_LABELS } from "./roles";
import { getClosedPeriodsMean, sumRoles } from "./timeseries";

type ThemeColor = Record<ThemeMode, string>;

// The colors come from `baseColors` in @blobscan/tailwind-config
// (tooling/tailwind/colors.ts): the primary color for sent, the blue color for
// received. The soft colors show the unused space in the size chart.
export const ROLE_COLORS: Record<
  AddressRole,
  { main: ThemeColor; soft: ThemeColor }
> = {
  sent: {
    main: { light: "#5D25D4", dark: "#9A71F2" },
    soft: { light: "#C8AEFA", dark: "#5D25D4" },
  },
  received: {
    main: { light: "#5D88F4", dark: "#5D88F4" },
    soft: { light: "#C9E5FF", dark: "#3B5BA8" },
  },
};

export const NETWORK_LINE_COLOR: ThemeColor = {
  light: "#A3A3A3",
  dark: "#7D80AB",
};
const AVG_LINE_COLOR: ThemeColor = { light: "#404040", dark: "#E5E5E5" };
// The color of a ratio line on the right y-axis.
export const LINE_ACCENT_COLOR: ThemeColor = {
  light: "#D97706",
  dark: "#FBBF24",
};

type Column = (string | number | null)[];

function toWeiColumn(values: bigint[]): Column {
  return values.map((v) => v.toString());
}

/** Returns the dataset that all the address charts use. */
export function buildDataset(
  data: AddressTimeseries
): ChartDataset | undefined {
  const hasTransactions = data.timestamps.some(
    (_, i) =>
      (data.sent.totalTransactions[i] ?? 0) > 0 ||
      (data.received.totalTransactions[i] ?? 0) > 0
  );

  if (!hasTransactions) {
    return undefined;
  }

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

export type ChartSpec = {
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

export function roleBars(column: string) {
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

/**
 * Returns a line that shows its points. A period with no data breaks the
 * line, thus a single active period shows as a point only.
 */
export function pointLine(
  name: string,
  column: string,
  color: string,
  opts: LineSeriesOption = {}
): LineSeriesOption {
  return {
    type: "line",
    name,
    encode: { x: "timestamp", y: column },
    itemStyle: { color },
    areaStyle: undefined,
    symbolSize: 4,
    smooth: false,
    connectNulls: false,
    ...opts,
  };
}

export function roleLines(column: string) {
  return (roles: AddressRole[], theme: ThemeMode): SeriesOption[] =>
    roles.map((role) =>
      pointLine(
        ROLE_LABELS[role],
        `${role}${column}`,
        ROLE_COLORS[role].main[theme]
      )
    );
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
export function stackedRoleBars(
  column: string,
  noun: string,
  avgColumn: string
) {
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

/** Returns the y-axes of the fee charts in the selected unit. */
export function getFeeAxes(unit: FeeUnit): { total: Axis; average: Axis } {
  return unit === "usd"
    ? {
        total: { type: "count", unitType: "fiat", unit: "USD" },
        average: { type: "average", unitType: "fiat", unit: "USD" },
      }
    : {
        total: {
          type: "count",
          unitType: "ether",
          unit: "wei",
          displayUnit: "Gwei",
        },
        average: {
          type: "average",
          unitType: "ether",
          unit: "wei",
          displayUnit: "Gwei",
        },
      };
}
