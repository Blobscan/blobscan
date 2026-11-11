import dayjs from "@blobscan/dayjs";

import type {
  MetricCardProps,
  MetricType,
} from "~/components/Cards/MetricCard";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { formatNumber } from "~/utils";
import type { AddressOverall, AddressRole, AddressTimeseries } from "../types";
import { BLOB_SIZE } from "./metrics";
import type { SummableColumn } from "./timeseries";
import { getClosedPeriodsMean, sumRoles } from "./timeseries";

/**
 * The name of a card and its help text. An icon after the name shows the
 * text. Each section defines its cards with this type.
 */
export type CardInfo = { name: string; description: string };

/**
 * Returns the values of a column in each period: of one role, or of both
 * roles together (see sumRoles) when there is no role.
 */
function getColumnValues(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): number[] {
  return role
    ? data.timestamps.map((_, i) => Number(data[role][column][i] ?? 0))
    : sumRoles(data, column);
}

/**
 * Returns the UTC day with the largest value of a column, of one role or of
 * both roles together. Hourly periods are added into days. Returns undefined
 * when all the values are 0.
 */
function getPeakDay(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): { day: Date; value: number } | undefined {
  const days = new Map<number, number>();

  getColumnValues(data, column, role).forEach((value, i) => {
    const timestamp = data.timestamps[i];

    if (!timestamp) {
      return;
    }

    const day = new Date(timestamp);

    day.setUTCHours(0, 0, 0, 0);
    days.set(day.getTime(), (days.get(day.getTime()) ?? 0) + value);
  });

  let peak: { day: Date; value: number } | undefined;

  days.forEach((value, time) => {
    if (value > 0 && (!peak || value > peak.value)) {
      peak = { day: new Date(time), value };
    }
  });

  return peak;
}

/**
 * Returns the mean of a column for each day, of one role or of both roles
 * together. The charts show the same mean as a line. An hourly mean is
 * multiplied by 24.
 */
function getDailyMean(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): number | undefined {
  const mean = getClosedPeriodsMean(getColumnValues(data, column, role));

  return mean !== undefined && data.granularity === "hour" ? mean * 24 : mean;
}

/** Returns the cards that show a skeleton while the data loads. */
export function skeletonCards(cards: CardInfo[]): MetricCardProps[] {
  return cards.map(({ name, description }) => ({ name, description }));
}

/**
 * Returns the props of a fee card: the amount in ether, and the USD amount
 * under it when the network has an ETH price.
 */
export function feeMetric(
  showUsd: boolean,
  wei: bigint | undefined,
  usd: number | null | undefined
): Pick<MetricCardProps, "metric" | "secondaryValue"> {
  return {
    metric: { primary: { value: wei, type: "ethereum" } },
    secondaryValue:
      showUsd && usd !== undefined && usd !== null ? (
        <FiatDisplay amount={usd} />
      ) : undefined,
  };
}

const ROLE_CARD_LABELS: Record<AddressRole, string> = {
  sent: "As Sender",
  received: "As Receiver",
};

/**
 * Formats a blob gas value. Above 1e9, it uses the compact form, for example
 * "393.22B", as MetricCard does for its main value.
 */
function formatBlobGas(value: bigint) {
  return formatNumber(value, value > BigInt(1e9) ? "compact" : "standard");
}

/**
 * Returns one total card for each shown role, for example
 * "Total Blob Txs (As Sender)". An address with no txs shows the sender card.
 */
export function roleTotalCards(
  data: AddressOverall,
  roles: AddressRole[],
  { name, description }: CardInfo,
  column: "totalTransactions" | "totalBlobs"
): MetricCardProps[] {
  const totalRoles: AddressRole[] = roles.length ? roles : ["sent"];

  return totalRoles.map((role) => ({
    name: `${name} (${ROLE_CARD_LABELS[role]})`,
    // The cards of the two roles have the same text.
    description,
    metric: { primary: { value: data[role][column] } },
    // Each blob uses BLOB_SIZE blob gas, thus the blob gas is the same value
    // in a different unit.
    secondaryValue:
      column === "totalBlobs"
        ? `${formatBlobGas(
            BigInt(data[role].totalBlobs) * BigInt(BLOB_SIZE)
          )} blob gas used`
        : undefined,
  }));
}

/**
 * Returns a card with the mean of a column for each day. The charts show the
 * same mean as a line.
 */
export function dailyMeanCard(
  card: CardInfo,
  timeseries: AddressTimeseries | undefined,
  column: SummableColumn,
  opts: { type?: MetricType; role?: AddressRole } = {}
): MetricCardProps {
  return {
    ...card,
    metric: {
      primary: {
        value: timeseries
          ? getDailyMean(timeseries, column, opts.role) ?? 0
          : undefined,
        type: opts.type,
        numberFormatOpts: opts.type ? undefined : { maximumFractionDigits: 2 },
      },
    },
  };
}

/**
 * Returns a card with the day that has the largest value of a column, of one
 * role or of both roles together. Without a peak, the value is 0, and there
 * is no date.
 */
export function peakDayCard(
  card: CardInfo,
  timeseries: AddressTimeseries | undefined,
  column: SummableColumn,
  opts: { type?: MetricType; role?: AddressRole } = {}
): MetricCardProps {
  const peakDay = timeseries && getPeakDay(timeseries, column, opts.role);

  return {
    ...card,
    metric: {
      primary: {
        value: timeseries ? peakDay?.value ?? 0 : undefined,
        type: opts.type,
      },
    },
    secondaryValue: peakDay
      ? dayjs.utc(peakDay.day).format("[on] MMM D, YYYY")
      : undefined,
  };
}
