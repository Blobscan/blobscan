import type { FC } from "react";

import { prettyFormatWei } from "@blobscan/eth-format";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { formatNumber } from "~/utils";
import { SectionLayout } from "./SectionLayout";
import type { CardInfo } from "./helpers/cards";
import { skeletonCards } from "./helpers/cards";
import type { ChartSpec } from "./helpers/charts";
import {
  NETWORK_LINE_COLOR,
  pointLine,
  ROLE_COLORS,
  roleLines,
} from "./helpers/charts";
import { BLOB_SIZE, ratio, toBigInt } from "./helpers/metrics";
import { getMainRole, getShownRoles, ROLE_LABELS } from "./helpers/roles";
import type {
  AddressOverall,
  AnalyticsSectionProps,
  RoleTotals,
} from "./types";

/**
 * Returns the mean price of blob gas, in wei, that the address paid, and the
 * mean price of the network in the same periods. Both prices are weighted by
 * gas. A price is undefined when there is no blob gas.
 */
function getBlobGasPrices(
  totals: Pick<RoleTotals, "totalBlobs" | "totalBlobBaseFee">,
  network: Pick<
    AddressOverall["network"],
    "totalBlobBaseFee" | "totalBlobGasUsed"
  >
): { address?: bigint; network?: bigint } {
  const gas = BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE);
  const networkGas = toBigInt(network.totalBlobGasUsed);

  return {
    address: gas ? toBigInt(totals.totalBlobBaseFee) / gas : undefined,
    network: networkGas
      ? toBigInt(network.totalBlobBaseFee) / networkGas
      : undefined,
  };
}

/**
 * Returns the price that the address paid for each unit of blob gas, divided
 * by the price of the network in the same periods. Both prices are weighted
 * by gas. A value below 1 means that the address posted when blob gas cost
 * less than the network average.
 */
function getTimingRatio(
  totals: Pick<RoleTotals, "totalBlobs" | "totalBlobBaseFee">,
  network: Pick<
    AddressOverall["network"],
    "totalBlobBaseFee" | "totalBlobGasUsed"
  >
): number | undefined {
  const gas = BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE);
  const addressPrice = ratio(toBigInt(totals.totalBlobBaseFee), gas);
  const networkPrice = ratio(
    toBigInt(network.totalBlobBaseFee),
    toBigInt(network.totalBlobGasUsed)
  );

  if (addressPrice === undefined || !networkPrice) {
    return undefined;
  }

  return addressPrice / networkPrice;
}

/** Returns the share of the network blobs, from 0 to 1. */
function getNetworkShare(
  totalBlobs: number,
  networkTotalBlobs: number
): number | undefined {
  return ratio(totalBlobs, networkTotalBlobs);
}

/**
 * The cards of the section. They are also the skeletons while the data loads.
 * They use the data of all the time.
 */
const CARDS = {
  share: {
    name: "Share of Network Blobs",
    description:
      "Percentage of all the blobs of the network that are in transactions of this address, for all the time. The time frame does not change this value.",
  },
  gasPrice: {
    name: "Avg. Blob Gas Price Paid",
    description:
      "Mean blob gas price of the transactions that the address sent, weighted by blob gas. The card compares it with the mean price of the network. Both are for all the time, and the time frame does not change them.",
  },
} satisfies Record<string, CardInfo>;

/**
 * Shows how much more or less than the network the address paid for blob
 * gas, for example "↓ 22% vs network (1.54 Gwei)". Green means that the
 * address paid less.
 */
function NetworkPriceComparison({
  timingRatio,
  networkPrice,
}: {
  /** The address price ÷ the network price. */
  timingRatio?: number;
  networkPrice: bigint;
}) {
  const network = prettyFormatWei(networkPrice);
  // The difference uses the full precision of the timing ratio, not the
  // prices in whole wei.
  const difference =
    timingRatio !== undefined
      ? Math.round((timingRatio - 1) * 1000) / 10
      : undefined;

  if (!difference) {
    return <span>Same as network ({network})</span>;
  }

  const isCheaper = difference < 0;

  return (
    <span>
      <span
        className={
          isCheaper
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }
      >
        {isCheaper ? "↓" : "↑"}{" "}
        {formatNumber(Math.abs(difference), "standard", {
          maximumFractionDigits: 1,
        })}
        %
      </span>{" "}
      vs network ({network})
    </span>
  );
}

/**
 * Returns the cards of the section. They use the data of all the time, so the
 * time frame does not change them.
 */
function buildCards(allTimeOverall?: AddressOverall): MetricCardProps[] {
  if (!allTimeOverall) {
    return skeletonCards(Object.values(CARDS));
  }

  const data = allTimeOverall;
  const roles = getShownRoles({
    sentTotalTransactions: data.sent.totalTransactions,
    receivedTotalTransactions: data.received.totalTransactions,
    selfTotalTransactions: data.selfTotalTransactions,
  });
  const totals = data[getMainRole(roles, data).main];
  const share = getNetworkShare(totals.totalBlobs, data.network.totalBlobs);
  const gasPrices = getBlobGasPrices(data.sent, data.network);

  return [
    {
      ...CARDS.share,
      metric: {
        primary: {
          value: (share ?? 0) * 100,
          type: "percentage",
          numberFormatOpts: { maximumFractionDigits: 4 },
        },
      },
    },
    ...(data.sent.totalTransactions
      ? [
          {
            // The sender pays the blob fee.
            ...CARDS.gasPrice,
            metric: {
              primary: { value: gasPrices.address, type: "ethereum" },
            },
            secondaryValue:
              gasPrices.network !== undefined ? (
                <NetworkPriceComparison
                  timingRatio={getTimingRatio(data.sent, data.network)}
                  networkPrice={gasPrices.network}
                />
              ) : undefined,
          } satisfies MetricCardProps,
        ]
      : []),
  ];
}

const CHARTS: ChartSpec[] = [
  {
    title: "Share of Network Blobs (%)",
    description:
      "Blobs of the address in each period, by role, as a percentage of all the blobs of the network in the same period.",
    yAxis: { type: "average" },
    series: roleLines("NetworkShare"),
  },
  {
    title: "Timing Ratio vs Network",
    description:
      "Blob gas price that the address paid in each period, divided by the mean price of the network in the same period. Below 1, the address paid less than the network. Only sent transactions pay blob fees.",
    yAxis: { type: "average" },
    series: (roles, theme) =>
      roles.includes("sent")
        ? [
            pointLine(
              ROLE_LABELS.sent,
              "sentTimingRatio",
              ROLE_COLORS.sent.main[theme],
              {
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
              }
            ),
          ]
        : [],
  },
];

export const NetworkTab: FC<AnalyticsSectionProps> = function (props) {
  return (
    <SectionLayout
      {...props}
      cards={buildCards(props.allTimeOverall)}
      charts={CHARTS}
      controls={props.timeFrameControl}
    />
  );
};
