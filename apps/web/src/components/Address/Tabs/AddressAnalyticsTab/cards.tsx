import dayjs from "@blobscan/dayjs";

import type {
  MetricCardProps,
  MetricType,
} from "~/components/Cards/MetricCard";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import { formatNumber } from "~/utils";
import type {
  AddressOverall,
  AddressRole,
  AddressTimeseries,
  SummableColumn,
} from "../../helpers";
import { BLOB_SIZE, getDailyMean, getPeakDay } from "../../helpers";

/** Returns the cards that show a skeleton while the data loads. */
export function skeletonCards(names: string[]): MetricCardProps[] {
  return names.map((name) => ({ name }));
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
  name: string,
  column: "totalTransactions" | "totalBlobs"
): MetricCardProps[] {
  const totalRoles: AddressRole[] = roles.length ? roles : ["sent"];

  return totalRoles.map((role) => ({
    name: `${name} (${ROLE_CARD_LABELS[role]})`,
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
  name: string,
  timeseries: AddressTimeseries | undefined,
  column: SummableColumn,
  opts: { type?: MetricType; role?: AddressRole } = {}
): MetricCardProps {
  return {
    name,
    metric: {
      primary: {
        value: timeseries && getDailyMean(timeseries, column, opts.role),
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
  name: string,
  timeseries: AddressTimeseries | undefined,
  column: SummableColumn,
  opts: { type?: MetricType; role?: AddressRole } = {}
): MetricCardProps {
  const peakDay = timeseries && getPeakDay(timeseries, column, opts.role);

  return {
    name,
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
