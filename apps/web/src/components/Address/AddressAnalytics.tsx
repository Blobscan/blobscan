import type { FC } from "react";
import { useMemo } from "react";
import {
  ArrowsRightLeftIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

import dayjs from "@blobscan/dayjs";
import { prettyFormatWei } from "@blobscan/eth-format";
import { z } from "@blobscan/zod";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type {
  MetricCardProps,
  MetricType,
} from "~/components/Cards/MetricCard";
import { FiatDisplay } from "~/components/Displays/FiatDisplay";
import {
  DEFAULT_CHART_TIME_FRAME,
  getTimeFrameOption,
  TimeFrameSelector,
} from "~/components/Selectors";
import { Tabs } from "~/components/Tabs";
import { FeeUnitToggle } from "~/components/Toggles";
import type { FeeUnit } from "~/components/Toggles";
import { api } from "~/api-client";
import { useIsTestnet } from "~/hooks/useIsTestnet";
import { useUrlState } from "~/hooks/useUrlState";
import BlobIcon from "~/icons/blob.svg";
import { feeUnitParamsSchema } from "~/schemas/feeUnit";
import { timeFrameParamSchema } from "~/schemas/filters";
import type { RenderableIcon } from "~/types/icons";
import { formatNumber } from "~/utils";
import { AddressActivity } from "./AddressActivity";
import { AddressCharts } from "./AddressCharts";
import { BlobSpaceCard } from "./BlobSpaceCard";
import type {
  AddressOverall,
  AddressRole,
  AddressSection,
  AddressTimeseries,
  SummableColumn,
} from "./helpers";
import {
  ADDRESS_SECTIONS,
  BLOB_SIZE,
  getDailyMean,
  getPeakDay,
  getDerivedMetrics,
  getMainRole,
  getNetworkShare,
  getShownRoles,
  getBlobGasPrices,
  getTimingRatio,
  SECTION_LABELS,
} from "./helpers";
import { getMetricDescription } from "./metric-descriptions";

const controlParamsSchema = timeFrameParamSchema
  .merge(feeUnitParamsSchema)
  .merge(z.object({ section: z.enum(ADDRESS_SECTIONS).optional() }));

// The metric cards of each section. The names are also the skeletons while
// the data loads.
const SECTION_METRIC_NAMES: Record<AddressSection, string[]> = {
  transactions: ["Total Blob Txs", "Avg. Daily Txs", "Max Daily Txs"],
  blobs: [
    "Total Blobs",
    "Avg. Blobs per Tx",
    "Avg. Daily Blobs",
    "Max Daily Blobs",
  ],
  fees: [
    "Total Blob Fees",
    "Avg. Blob Fee per Tx",
    "Cost per KiB of Blob Data",
    "Calldata Savings",
    "Wasted Blob Fees",
  ],
  // The Blob Space card, before these cards, shows the utilization and the
  // used and the unused space.
  usage: ["Avg. Data per Tx", "Avg. Daily Data", "Max Daily Data"],
  network: ["Share of Network Blobs", "Avg. Blob Gas Price Paid"],
  // AddressActivity has its own cards, for all the time.
  activity: [],
};

function getCardSection(name: string): AddressSection | undefined {
  // The total cards have the role in the name, for example
  // "Total Blob Txs (As Sender)".
  return ADDRESS_SECTIONS.find((section) =>
    SECTION_METRIC_NAMES[section].some((n) => name.startsWith(n))
  );
}

const SECTION_ICONS: Record<AddressSection, RenderableIcon> = {
  transactions: ArrowsRightLeftIcon,
  blobs: BlobIcon,
  fees: CurrencyDollarIcon,
  usage: CircleStackIcon,
  network: GlobeAltIcon,
  activity: CalendarDaysIcon,
};

/**
 * Returns the props of a fee card: the amount in ether, and the USD amount
 * under it when the network has an ETH price.
 */
function feeMetric(
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

function buildMetricCards(
  data: AddressOverall,
  timeseries: AddressTimeseries | undefined,
  roles: AddressRole[],
  showUsd: boolean
): MetricCardProps[] {
  const { main } = getMainRole(roles, data);
  // One total card for each shown role. An address with no txs shows the
  // sender cards.
  const totalRoles: AddressRole[] = roles.length ? roles : ["sent"];
  const roleTotalCards = (
    name: string,
    column: "totalTransactions" | "totalBlobs"
  ): MetricCardProps[] =>
    totalRoles.map((role) => ({
      name: `${name} (${ROLE_CARD_LABELS[role]})`,
      metric: { primary: { value: data[role][column] } },
      // Each blob uses BLOB_SIZE blob gas, thus the blob gas is the same
      // value in a different unit.
      secondaryValue:
        column === "totalBlobs"
          ? `${formatBlobGas(
              BigInt(data[role].totalBlobs) * BigInt(BLOB_SIZE)
            )} blob gas used`
          : undefined,
    }));
  const m = data[main];
  const dm = getDerivedMetrics(m);
  // The day with the largest value of a column, of one role or of both
  // roles together. Without a peak, the value is 0, and there is no date.
  const peakDayCard = (
    name: string,
    column: SummableColumn,
    type?: MetricType,
    role?: AddressRole
  ): MetricCardProps => {
    const peakDay = timeseries && getPeakDay(timeseries, column, role);

    return {
      name,
      metric: {
        primary: {
          value: timeseries ? peakDay?.value ?? 0 : undefined,
          type,
        },
      },
      secondaryValue: peakDay
        ? dayjs.utc(peakDay.day).format("[on] MMM D, YYYY")
        : undefined,
    };
  };

  return [
    ...roleTotalCards("Total Blob Txs", "totalTransactions"),
    ...roleTotalCards("Total Blobs", "totalBlobs"),
    {
      name: "Avg. Blobs per Tx",
      metric: {
        primary: {
          value: dm.avgBlobsPerTx,
          numberFormatOpts: { maximumFractionDigits: 2 },
        },
      },
    },
    {
      name: "Avg. Daily Blobs",
      metric: {
        primary: {
          // The same mean as the "Avg. Daily Blobs" line of the chart.
          value: timeseries && getDailyMean(timeseries, "totalBlobs"),
          numberFormatOpts: { maximumFractionDigits: 2 },
        },
      },
    },
    peakDayCard("Max Daily Blobs", "totalBlobs"),
    {
      name: "Avg. Daily Txs",
      metric: {
        primary: {
          // The same mean as the "Avg. Daily Txs" line of the chart.
          value: timeseries && getDailyMean(timeseries, "totalTransactions"),
          numberFormatOpts: { maximumFractionDigits: 2 },
        },
      },
    },
    peakDayCard("Max Daily Txs", "totalTransactions"),
    {
      name: "Avg. Data per Tx",
      metric: {
        primary: {
          value: m.totalTransactions
            ? Number(m.totalBlobUsageSize) / m.totalTransactions
            : undefined,
          type: "bytes",
        },
      },
    },
    {
      name: "Avg. Daily Data",
      metric: {
        primary: {
          // The Blob Usage section shows the main role only, as its chart.
          value:
            timeseries && getDailyMean(timeseries, "totalBlobUsageSize", main),
          type: "bytes",
        },
      },
    },
    peakDayCard("Max Daily Data", "totalBlobUsageSize", "bytes", main),
    {
      name: "Total Blob Fees",
      ...feeMetric(showUsd, BigInt(m.totalBlobBaseFee), m.totalBlobBaseFeeUsd),
    },
    {
      name: "Avg. Blob Fee per Tx",
      ...feeMetric(showUsd, dm.avgFeePerTx, dm.avgFeePerTxUsd),
    },
    {
      name: "Cost per KiB of Blob Data",
      ...feeMetric(showUsd, dm.costPerKb, dm.costPerKbUsd),
    },
    {
      name: "Calldata Savings",
      ...feeMetric(showUsd, dm.calldataSavings, dm.calldataSavingsUsd),
    },
    {
      name: "Wasted Blob Fees",
      ...feeMetric(showUsd, dm.unusedFee, dm.unusedFeeUsd),
    },
  ];
}

/**
 * Returns the cards of the Network section. They use the data of all the
 * time, so the time frame does not change them.
 */
function buildNetworkCards(allTimeData: AddressOverall): MetricCardProps[] {
  const data = allTimeData;
  const roles = getShownRoles({
    sentTotalTransactions: data.sent.totalTransactions,
    receivedTotalTransactions: data.received.totalTransactions,
    selfTotalTransactions: data.selfTotalTransactions,
  });
  const m = data[getMainRole(roles, data).main];
  const share = getNetworkShare(m.totalBlobs, data.network.totalBlobs);
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

export type AddressAnalyticsProps = {
  address: string;
};

export const AddressAnalytics: FC<AddressAnalyticsProps> = function ({
  address,
}) {
  const { state, updateState, isReady } = useUrlState(controlParamsSchema);
  const isTestnet = useIsTestnet();
  const showUsd = isTestnet === false;
  const timeFrame = state?.timeFrame ?? DEFAULT_CHART_TIME_FRAME;
  const unit: FeeUnit = showUsd ? state?.unit ?? "eth" : "eth";
  const section: AddressSection = state?.section ?? "activity";
  const queryOpts = {
    enabled: isReady && !!address,
    refetchOnWindowFocus: false,
  };

  const overall = api.address.getOverall.useQuery(
    { address, timeFrame },
    queryOpts
  );
  const timeseries = api.address.getTimeseries.useQuery(
    { address, timeFrame },
    queryOpts
  );
  // The Network cards use all the time. With the "All" time frame, this is
  // the same query as the one above.
  const allTimeOverall = api.address.getOverall.useQuery(
    { address, timeFrame: "All" },
    queryOpts
  );

  const data = overall.data?.data;
  const roles = useMemo(
    () =>
      data
        ? getShownRoles({
            sentTotalTransactions: data.sent.totalTransactions,
            receivedTotalTransactions: data.received.totalTransactions,
            selfTotalTransactions: data.selfTotalTransactions,
          })
        : (["sent"] as AddressRole[]),
    [data]
  );
  // The blob space of the main role, as the other cards use.
  const mainTotals = data ? data[getMainRole(roles, data).main] : undefined;
  // Without data, the cards show their skeleton.
  const allTimeData = allTimeOverall.data?.data;
  const getSectionCards = (section: AddressSection): MetricCardProps[] => {
    if (section === "network") {
      return allTimeData
        ? buildNetworkCards(allTimeData)
        : SECTION_METRIC_NAMES.network.map((name) => ({ name }));
    }

    return data
      ? buildMetricCards(data, timeseries.data?.data, roles, showUsd).filter(
          (card) => card.name && getCardSection(card.name) === section
        )
      : SECTION_METRIC_NAMES[section].map((name) => ({ name }));
  };

  return (
    <Tabs
      fullWidth
      selected={section}
      onChange={(value) =>
        updateState({ section: value !== "activity" ? value : undefined })
      }
      tabs={ADDRESS_SECTIONS.map((value) => ({
        value,
        label: SECTION_LABELS[value],
        icon: SECTION_ICONS[value],
        content:
          value === "activity" ? (
            <AddressActivity
              address={address}
              allTime={data?.allTime}
              enabled={queryOpts.enabled}
            />
          ) : (
            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {value === "usage" && (
                  <BlobSpaceCard
                    className="col-span-full"
                    usedSize={
                      mainTotals
                        ? BigInt(mainTotals.totalBlobUsageSize)
                        : undefined
                    }
                    totalSize={
                      mainTotals
                        ? BigInt(mainTotals.totalBlobs) * BigInt(BLOB_SIZE)
                        : undefined
                    }
                    totalBlobs={mainTotals?.totalBlobs}
                  />
                )}
                {getSectionCards(value).map((card) => (
                  <MetricCard
                    key={card.name}
                    description={getMetricDescription(card.name)}
                    {...card}
                  />
                ))}
              </div>
              <Card>
                {/* The Card gap is too small between the controls and the charts. */}
                <div className="flex flex-col gap-10">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-24">
                      <TimeFrameSelector
                        selected={getTimeFrameOption(timeFrame)}
                        onChange={({ value }) =>
                          updateState({ timeFrame: value })
                        }
                      />
                    </div>
                    {/* Only the fee charts use the unit. */}
                    {showUsd && value === "fees" && (
                      <div className="w-36">
                        <FeeUnitToggle
                          variant="control"
                          unit={unit}
                          onChange={(value) =>
                            updateState({
                              unit: value !== "eth" ? value : undefined,
                            })
                          }
                        />
                      </div>
                    )}
                  </div>
                  <AddressCharts
                    section={value}
                    data={timeseries.data?.data}
                    roles={roles}
                    mainRole={data ? getMainRole(roles, data).main : undefined}
                    unit={unit}
                    isLoading={timeseries.isLoading}
                  />
                </div>
              </Card>
            </div>
          ),
      }))}
    />
  );
};
