import type { ReactNode } from "react";
import React, { useCallback, useMemo } from "react";
import type { NextPage } from "next";

import { z } from "@blobscan/zod";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import type { ChartBaseProps } from "~/components/Charts/ChartBase";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { RollupSelector, TIME_FRAME_OPTIONS } from "~/components/Selectors";
import { ROLLUP_OPTIONS } from "~/components/Selectors/RollupSelector";
import { Listbox } from "~/components/Selects";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { TabsBase } from "~/components/Tabs/TabsBase";
import { AvgBlobBaseFeeChart } from "~/components/TimeseriesCharts/AvgBlobBaseFeeChart";
import { AvgBlobBaseFeeUsdChart } from "~/components/TimeseriesCharts/AvgBlobBaseFeeUsdChart";
import { BlobGasPriceChart } from "~/components/TimeseriesCharts/BlobGasPriceChart";
import { EthPriceChart } from "~/components/TimeseriesCharts/EthPriceChart";
import { FeeUnitChart } from "~/components/TimeseriesCharts/FeeUnitChart";
import { TotalBlobBaseFeesChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesChart";
import { TotalBlobBaseFeesUsdChart } from "~/components/TimeseriesCharts/TotalBlobBaseFeesUsdChart";
import { TotalBlobGasComparisonChart } from "~/components/TimeseriesCharts/TotalBlobGasComparisonChart";
import { TotalBlobGasUsedChart } from "~/components/TimeseriesCharts/TotalBlobGasUsedChart";
import { TotalBlobSizeChart } from "~/components/TimeseriesCharts/TotalBlobSizeChart";
import { TotalBlobUsageSizeChart } from "~/components/TimeseriesCharts/TotalBlobUsageSizeChart";
import { TotalBlobsChart } from "~/components/TimeseriesCharts/TotalBlobsChart";
import { TotalBlocksChart } from "~/components/TimeseriesCharts/TotalBlocksChart";
import { TotalTransactionsChart } from "~/components/TimeseriesCharts/TotalTransactionsChart";
import { TotalUniqueAddressesChart } from "~/components/TimeseriesCharts/TotalUniqueAddressesChart";
import type { FeeUnit } from "~/components/Toggles";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import { useChain } from "~/hooks/useChain";
import { useIsMainnet } from "~/hooks/useIsMainnet";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import { useUrlState } from "~/hooks/useUrlState";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import { feeUnitSchema } from "~/schemas/feeUnit";
import {
  categoriesParamSchema,
  rollupsSchema,
  chartTimeFrameSchema,
} from "~/schemas/filters";
import { calculatePercentage } from "~/utils";

const SKELETON_OPTS: ChartBaseProps["skeletonOpts"] = {
  chart: {
    itemCount: 15,
  },
};

const STATS_TABS = [
  "blob",
  "block",
  "transaction",
  "address",
  "gas",
  "fee",
  "price",
] as const;
type StatsTab = (typeof STATS_TABS)[number];
const TAB_LABELS: Record<StatsTab, string> = {
  blob: "Blobs",
  block: "Blocks",
  transaction: "Transactions",
  address: "Addresses",
  gas: "Gas",
  fee: "Fees",
  price: "ETH Price",
};
const statsSectionSchema = z.object({
  section: z.enum(["all", ...STATS_TABS]).catch("blob"),
});

const controlQueryParamsSchema = statsSectionSchema.extend({
  timeFrame: z.enum(["15d", ...chartTimeFrameSchema.options]).catch("15d"),
  unit: feeUnitSchema.catch("usd"),
  categories: categoriesParamSchema.shape.categories.catch(undefined),
  rollups: rollupsSchema.shape.rollups.catch(undefined),
});
const TIME_FRAME_OPTIONS_WITH_DEFAULT = [
  ...TIME_FRAME_OPTIONS.slice(0, 2),
  { value: "15d" as const, label: "15D" },
  ...TIME_FRAME_OPTIONS.slice(2),
];

function NetworkChart({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <p className="text-xs">Network-wide · Rollup filter does not apply</p>
      {children}
    </div>
  );
}

const Stats: NextPage = function () {
  const chain = useChain();
  const isMainnet = useIsMainnet();
  const { state, updateState, isReady } = useUrlState(controlQueryParamsSchema);
  const timeFrame = state?.timeFrame ?? "15d";
  const unit = state?.unit ?? "usd";
  const selectedRollups = useMemo(
    () =>
      ROLLUP_OPTIONS.filter((option) => state?.rollups?.includes(option.value)),
    [state?.rollups]
  );
  const rollups = state?.rollups ?? ["all" as const];
  const categories =
    state?.categories ?? (selectedRollups.length ? [] : ["other" as const]);
  const buildViewLink = useCallback(
    (metricName: string, feeUnit?: FeeUnit, networkWide = false) => {
      // Full View pages do not support the overview's 15-day range.
      const query = new URLSearchParams(
        timeFrame === "15d" ? {} : { timeFrame }
      );
      if (!networkWide) {
        if (state?.rollups?.length)
          query.set("rollups", state.rollups.join(","));
        if (state?.categories?.length)
          query.set("categories", state.categories.join(","));
      }
      if (feeUnit) query.set("unit", feeUnit);
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`${routes.stat(metricName)}${
              query.size ? `?${query.toString()}` : ""
            }`}
          >
            <span className="text-sm">Full View</span>
          </Link>
        </div>
      );
    },
    [timeFrame, state?.rollups, state?.categories]
  );

  const {
    data: categorizedChartDatasets,
    isLoading: categorizedDatasetsLoading,
    error: categorizedChartsError,
  } = useTimeseriesQuery({
    metrics: [
      "totalBlobs",
      "totalBlobSize",
      "totalBlobUsageSize",
      "totalBlobGasUsed",
      "totalBlobBaseFee",
      ...(isMainnet ? (["totalBlobBaseFeeUsd"] as const) : []),
      "totalTransactions",
      "totalUniqueReceivers",
      "totalUniqueSenders",
      "totalBlobAsCalldataGasUsed",
    ],
    categories,
    rollups,
    timeFrame,
  });
  const {
    data: globalChartDatasets,
    isLoading: globalDatasetsLoading,
    error: globalChartsError,
  } = useTimeseriesQuery({
    metrics: [
      "maxBlobGasPrice",
      "avgBlobGasPrice",
      "minBlobGasPrice",
      "avgBlobBaseFee",
      ...(isMainnet ? (["totalUsdPricedTransactions"] as const) : []),
      "avgBlobMaxFee",
      ...(isMainnet ? (["totalBlobBaseFeeUsd"] as const) : []),
      "totalTransactions",
      "totalBlocks",
      "totalUniqueReceivers",
      "totalUniqueSenders",
      "totalBlobAsCalldataGasUsed",
      "totalBlobGasUsed",
      ...(isMainnet
        ? (["maxEthPrice", "avgEthPrice", "minEthPrice"] as const)
        : []),
    ],
    timeFrame,
  });
  const { data: allOverallStats, error: overallStatsError } =
    api.stats.getOverall.useQuery(undefined, {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      select: ({ data }) => data,
    });

  const aggregatedMetrics = useAggregateOverallStats(
    selectedRollups.map((r) => r.value),
    allOverallStats
  );
  const selectedCategorizedChartDatasets = useMemo(() => {
    if (!categorizedChartDatasets || !Array.isArray(categorizedChartDatasets)) {
      return;
    }

    return !selectedRollups.length
      ? categorizedChartDatasets
      : categorizedChartDatasets.filter((dataset) =>
          selectedRollups.map((r) => `rollup-${r.value}`).includes(dataset.id)
        );
  }, [categorizedChartDatasets, selectedRollups]);

  const blobSize = chain
    ? chain.latestFork.blobParams.bytesPerFieldElement *
      chain.latestFork.blobParams.fieldElementsPerBlob
    : undefined;

  const sections = useMemo<
    {
      id: StatsTab;
      metrics: MetricCardProps[];
      charts: ReactNode[];
    }[]
  >(
    () => [
      {
        id: "blob",
        metrics: [
          {
            name: "Total Blobs",
            description:
              "The number of blobs in the selected scope. Repeated blobs are counted each time they appear.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobs,
              },
            },
          },
          {
            name: "Total Blob Size",
            description: "The total size of blobs, including padding bytes.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobSize,
                type: "bytes",
              },
            },
          },
          {
            name: "Total Blob Usage Size",
            description:
              "The total size of blob data after trailing zero bytes are removed.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobUsageSize,
                type: "bytes",
              },
            },
          },
          {
            name: "Avg. Blob Usage Size",
            description:
              "The average blob size after trailing zero bytes are removed. The percentage compares this size with the full blob size.",
            metric: {
              primary: {
                value: aggregatedMetrics?.avgBlobUsageSize,
                type: "bytes",
              },
              secondary:
                blobSize && aggregatedMetrics?.avgBlobUsageSize
                  ? {
                      value: calculatePercentage(
                        aggregatedMetrics?.avgBlobUsageSize,
                        blobSize,
                        {
                          decimals: 2,
                        }
                      ),
                      type: "percentage",
                    }
                  : undefined,
            },
          },
          {
            name: "Total Unique Blobs",
            description:
              "The number of distinct blobs that first appear in the selected period, identified by their versioned hashes.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalUniqueBlobs,
              },
            },
          },
        ],
        charts: [
          <TotalBlobsChart
            key="total-blobs"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-blobs")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <TotalBlobSizeChart
            key="total-blob-size"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-blob-size")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <TotalBlobUsageSizeChart
            key="total-blob-usage-size"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-blob-usage-size")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "block",
        metrics: [
          {
            name: "Total Blocks",
            description: "The number of blocks that contain blob transactions.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlocks,
              },
            },
          },
        ],
        charts: [
          <NetworkChart key="total-blocks">
            <TotalBlocksChart
              dataset={globalChartDatasets}
              headerControls={buildViewLink("total-blocks", undefined, true)}
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
        ],
      },
      {
        id: "gas",
        metrics: [
          {
            name: "Total Blob Gas Used",
            description:
              "The total blob gas used. Blob gas is separate from execution gas.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobGasUsed,
              },
            },
          },
          {
            name: "Total Gas Saved",
            description:
              "The estimated gas needed to send blob data as calldata, minus the blob gas used.",
            metric: {
              primary: {
                value:
                  aggregatedMetrics?.totalBlobAsCalldataGasUsed !== undefined &&
                  aggregatedMetrics.totalBlobGasUsed !== undefined
                    ? aggregatedMetrics.totalBlobAsCalldataGasUsed -
                      aggregatedMetrics.totalBlobGasUsed
                    : undefined,
              },
            },
            // secondaryMetric={
            //   overallStats &&
            //   BigInt(overallStats.block.totalBlobAsCalldataFee) > BigInt(0)
            //     ? {
            //         value: calculatePercentage(
            //           BigInt(overallStats.block.totalBlobGasUsed),
            //           BigInt(overallStats.block.totalBlobAsCalldataGasUsed),
            //           { returnComplement: true }
            //         ),
            //         type: "percentage",
            //       }
            //     : undefined
            // }
          },
        ],
        charts: [
          <TotalBlobGasUsedChart
            key="total-blob-gas-used"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-blob-gas-used")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <NetworkChart key="total-blob-gas-used-comparison">
            <TotalBlobGasComparisonChart
              dataset={globalChartDatasets}
              headerControls={buildViewLink(
                "total-blob-gas-used-comparison",
                undefined,
                true
              )}
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
        ],
      },
      {
        id: "fee",
        metrics: [
          {
            name: "Max. Blob Gas Price",
            description:
              "The highest price per unit of blob gas in the selected scope.",
            metric: {
              primary: {
                value: aggregatedMetrics?.maxBlobGasPrice,
                type: "ethereum",
                numberFormatOpts: {
                  maximumFractionDigits: 9,
                },
              },
            },
          },
          {
            name: "Avg. Blob Gas Price",
            description: "The average price per unit of blob gas.",
            metric: {
              primary: {
                value: aggregatedMetrics?.avgBlobGasPrice,
                type: "ethereum",
                numberFormatOpts: {
                  maximumFractionDigits: 9,
                },
              },
            },
          },
          {
            name: "Min. Blob Gas Price",
            description:
              "The lowest price per unit of blob gas in the selected scope.",
            metric: {
              primary: {
                value: aggregatedMetrics?.minBlobGasPrice,
                type: "ethereum",
                numberFormatOpts: {
                  maximumFractionDigits: 9,
                },
              },
            },
          },
          {
            name: "Total Blob Fees",
            description:
              "The total blob base fees. These fees exclude execution gas fees.",
            metric: {
              // Use native fees when the network has no ETH price.
              primary:
                isMainnet === true
                  ? {
                      value: aggregatedMetrics?.totalBlobBaseFeeUsd,
                      type: "fiat",
                    }
                  : {
                      value:
                        isMainnet === false
                          ? aggregatedMetrics?.totalBlobBaseFee
                          : undefined,
                      type: "ethereum",
                    },
            },
          },
          {
            name: "Total Tx Fees Saved",
            description:
              "The estimated cost to send blob data as calldata, minus the blob base fees.",
            metric: {
              primary:
                isMainnet === true
                  ? {
                      value:
                        aggregatedMetrics?.totalBlobAsCalldataFeeUsd !==
                          undefined &&
                        aggregatedMetrics.totalBlobBaseFeeUsd !== undefined
                          ? aggregatedMetrics.totalBlobAsCalldataFeeUsd -
                            aggregatedMetrics.totalBlobBaseFeeUsd
                          : undefined,
                      type: "fiat",
                    }
                  : {
                      value:
                        isMainnet === false &&
                        aggregatedMetrics?.totalBlobAsCalldataFee !==
                          undefined &&
                        aggregatedMetrics.totalBlobBaseFee !== undefined
                          ? aggregatedMetrics.totalBlobAsCalldataFee -
                            aggregatedMetrics.totalBlobBaseFee
                          : undefined,
                      type: "ethereum",
                    },
            },
            // secondaryMetric={
            //   overallStats
            //     ? {
            //         value: calculatePercentage(
            //           BigInt(overallStats.block.totalBlobFee),
            //           BigInt(overallStats.block.totalBlobAsCalldataFee),
            //           { returnComplement: true }
            //         ),
            //         type: "percentage",
            //       }
            //     : undefined
            // }
          },
          {
            name: "Avg. Max Blob Gas Fee",
            description:
              "The average maximum fee per unit of blob gas set by transaction senders.",
            metric: {
              primary: {
                value: aggregatedMetrics?.avgMaxBlobGasFee,
                type: "ethereum",
              },
            },
          },
        ],
        charts: [
          <NetworkChart key="blob-gas-price">
            <BlobGasPriceChart
              dataset={globalChartDatasets}
              headerControls={buildViewLink("blob-gas-price", undefined, true)}
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
          <FeeUnitChart
            key="total-blob-base-fees"
            ethChart={TotalBlobBaseFeesChart}
            usdChart={isMainnet ? TotalBlobBaseFeesUsdChart : undefined}
            defaultUnit="usd"
            unit={unit}
            onUnitChange={(unit) => updateState({ unit })}
            dataset={selectedCategorizedChartDatasets}
            headerControls={(unit) =>
              buildViewLink("total-blob-base-fees", unit)
            }
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <NetworkChart key="avg-blob-base-fee">
            <FeeUnitChart
              ethChart={AvgBlobBaseFeeChart}
              usdChart={isMainnet ? AvgBlobBaseFeeUsdChart : undefined}
              defaultUnit="usd"
              unit={unit}
              onUnitChange={(unit) => updateState({ unit })}
              dataset={globalChartDatasets}
              headerControls={(unit) =>
                buildViewLink("avg-blob-base-fee", unit, true)
              }
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
        ],
      },
      {
        id: "transaction",
        metrics: [
          {
            name: "Total Transactions",
            description: "The number of transactions that contain blobs.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalTransactions,
              },
            },
          },
        ],
        charts: [
          <TotalTransactionsChart
            key="total-transactions"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-transactions")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "address",
        metrics: [
          {
            name: "Total Unique Receivers",
            description:
              "The number of addresses whose first received blob transaction is in the selected period.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalUniqueReceivers,
              },
            },
          },
          {
            name: "Total Unique Senders",
            description:
              "The number of addresses whose first sent blob transaction is in the selected period.",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalUniqueSenders,
              },
            },
          },
        ],
        charts: [
          <NetworkChart key="total-unique-addresses">
            <TotalUniqueAddressesChart
              dataset={globalChartDatasets}
              headerControls={buildViewLink(
                "total-unique-addresses",
                undefined,
                true
              )}
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
        ],
      },
      {
        id: "price",
        metrics: [
          {
            name: "Max. ETH Price",
            description: "The highest ETH price in USD in the selected scope.",
            metric: {
              primary: {
                value: aggregatedMetrics?.maxEthPrice,
                type: "fiat",
              },
            },
          },
          {
            name: "Avg. ETH Price",
            description: "The average ETH price in USD in the selected scope.",
            metric: {
              primary: {
                value: aggregatedMetrics?.avgEthPrice,
                type: "fiat",
              },
            },
          },
          {
            name: "Min. ETH Price",
            description: "The lowest ETH price in USD in the selected scope.",
            metric: {
              primary: {
                value: aggregatedMetrics?.minEthPrice,
                type: "fiat",
              },
            },
          },
        ],
        charts: [
          <NetworkChart key="eth-price">
            <EthPriceChart
              dataset={globalChartDatasets}
              headerControls={buildViewLink("eth-price", undefined, true)}
              isLoading={globalDatasetsLoading}
              skeletonOpts={SKELETON_OPTS}
              compact
            />
          </NetworkChart>,
        ],
      },
    ],
    [
      aggregatedMetrics,
      buildViewLink,
      unit,
      updateState,
      blobSize,
      isMainnet,
      selectedCategorizedChartDatasets,
      globalChartDatasets,
      categorizedDatasetsLoading,
      globalDatasetsLoading,
    ]
  );

  const error =
    categorizedChartsError || globalChartsError || overallStatsError;

  const selectedTab =
    !state ||
    state.section === "all" ||
    (state.section === "price" && !isMainnet)
      ? "blob"
      : state.section;
  const availableTabs = STATS_TABS.filter(
    (tab) => tab !== "price" || isMainnet === true
  );

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!isReady) return null;

  return (
    <>
      <SeoMetaTags
        title="Stats Overview"
        description="Explore comprehensive metrics and stats about blobs, blocks, transactions, gas usage, fees, etc."
      />
      <div className="flex flex-col gap-8">
        <Header>Stats Overview</Header>
        <TabsBase
          fullWidth
          selected={selectedTab}
          onChange={(section) => updateState({ section })}
          tabs={availableTabs.map((value) => {
            const section = sections.find((section) => section.id === value)!;
            return {
              value,
              label: TAB_LABELS[value],
              content: (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {section.metrics.map((metric) => (
                      <MetricCard
                        key={metric.name}
                        {...metric}
                        name={`${metric.name} (All-time)`}
                      />
                    ))}
                  </div>
                  <Card>
                    <div className="flex flex-col gap-10">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-24">
                          <Listbox
                            options={TIME_FRAME_OPTIONS_WITH_DEFAULT}
                            selected={
                              TIME_FRAME_OPTIONS_WITH_DEFAULT.find(
                                (option) => option.value === timeFrame
                              )!
                            }
                            onChange={({ value }) =>
                              updateState({ timeFrame: value })
                            }
                          />
                        </div>
                        <div className="w-64 max-w-full">
                          <RollupSelector
                            selected={selectedRollups}
                            onChange={(rollups) =>
                              updateState({
                                rollups: rollups?.length
                                  ? rollups.map((r) => r.value)
                                  : undefined,
                                categories: undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 [&>div]:min-w-0">
                        {section.charts.map((chart, index) => (
                          <div key={index}>{chart}</div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              ),
            };
          })}
        />
      </div>
    </>
  );
};

export default Stats;
