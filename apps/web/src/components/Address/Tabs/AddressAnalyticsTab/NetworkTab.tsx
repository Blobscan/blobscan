import type { FC } from "react";

import { prettyFormatWei } from "@blobscan/eth-format";

import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { formatNumber } from "~/utils";
import type { AddressOverall } from "../../helpers";
import {
  getBlobGasPrices,
  getMainRole,
  getNetworkShare,
  getShownRoles,
  getTimingRatio,
  ROLE_LABELS,
} from "../../helpers";
import { SectionLayout } from "./SectionLayout";
import { skeletonCards } from "./cards";
import type { ChartSpec } from "./charts";
import {
  NETWORK_LINE_COLOR,
  pointLine,
  ROLE_COLORS,
  roleLines,
} from "./charts";
import type { AnalyticsSectionProps } from "./types";

/** The names of the cards. They are also the skeletons while the data loads. */
export const NETWORK_CARD_NAMES = [
  "Share of Network Blobs",
  "Avg. Blob Gas Price Paid",
];

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
    return skeletonCards(NETWORK_CARD_NAMES);
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
      name: "Share of Network Blobs",
      metric: {
        primary: {
          value: share !== undefined ? share * 100 : undefined,
          type: "percentage",
          numberFormatOpts: { maximumFractionDigits: 4 },
        },
      },
    },
    ...(data.sent.totalTransactions
      ? [
          {
            // The sender pays the blob fee.
            name: "Avg. Blob Gas Price Paid",
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
