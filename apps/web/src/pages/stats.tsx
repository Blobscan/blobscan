import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";

import { z } from "@blobscan/zod";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import type { ChartBaseProps } from "~/components/Charts/ChartBase";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { Scrollable } from "~/components/Scrollable";
import { RollupSelector } from "~/components/Selectors";
import type { RollupSelectorOption } from "~/components/Selectors";
import type {
  SectionName,
  SectionOption,
} from "~/components/Selectors/StatsSectionSelector";
import {
  DEFAULT_SECTION,
  SECTION_NAMES,
  SECTION_OPTIONS,
  StatsSectionSelector,
} from "~/components/Selectors/StatsSectionSelector";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { SubHeader } from "~/components/SubHeader";
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
import { categoriesParamSchema, rollupsSchema } from "~/schemas/filters";
import { calculatePercentage } from "~/utils";

function buildViewLink(metricName: string, unit?: FeeUnit) {
  return (
    <Link
      href={`${routes.stat(metricName)}${
        unit && unit !== "eth" ? `?unit=${unit}` : ""
      }`}
    >
      <span className="text-sm">Full View</span>
    </Link>
  );
}

const SKELETON_OPTS: ChartBaseProps["skeletonOpts"] = {
  chart: {
    itemCount: 15,
  },
};

const statsSectionSchema = z.object({
  section: z.enum(SECTION_NAMES).default("all"),
});

const controlQueryParamsSchema = statsSectionSchema
  .merge(categoriesParamSchema)
  .merge(rollupsSchema);

const Stats: NextPage = function () {
  const chain = useChain();
  const isMainnet = useIsMainnet();
  const { state, updateState } = useUrlState(controlQueryParamsSchema);
  const { categories, rollups } =
    state?.categories?.length && state?.rollups?.length
      ? { categories: state.categories, rollups: state.rollups }
      : { categories: ["other" as const], rollups: ["all" as const] };

  const [selectedSection, setSelectedSection] =
    useState<SectionOption>(DEFAULT_SECTION);

  const [selectedRollups, setSelectedRollups] = useState<
    RollupSelectorOption[]
  >([]);
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
    timeFrame: "15d",
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
    timeFrame: "15d",
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
      id: SectionName;
      title: string;
      metrics: MetricCardProps[];
      charts: ReactNode[];
    }[]
  >(
    () => [
      {
        id: "blob",
        title: "Blob Charts",
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
        title: "Block Charts",
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
          <TotalBlocksChart
            key="total-blocks"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("total-blocks")}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "gas",
        title: "Gas Charts",
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
          <BlobGasPriceChart
            key="blob-gas-price"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("blob-gas-price")}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <TotalBlobGasComparisonChart
            key="total-blob-gas-used-comparison"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("total-blob-gas-used-comparison")}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "fee",
        title: "Blob Fee Charts",
        metrics: [
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
          <FeeUnitChart
            key="total-blob-base-fees"
            ethChart={TotalBlobBaseFeesChart}
            usdChart={isMainnet ? TotalBlobBaseFeesUsdChart : undefined}
            defaultUnit="usd"
            dataset={selectedCategorizedChartDatasets}
            headerControls={(unit) =>
              buildViewLink("total-blob-base-fees", unit)
            }
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <FeeUnitChart
            key="avg-blob-base-fee"
            ethChart={AvgBlobBaseFeeChart}
            usdChart={isMainnet ? AvgBlobBaseFeeUsdChart : undefined}
            defaultUnit="usd"
            dataset={globalChartDatasets}
            headerControls={(unit) => buildViewLink("avg-blob-base-fee", unit)}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "transaction",
        title: "Transaction Charts",
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
          <TotalTransactionsChart
            key="total-transactions"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-transactions")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <TotalUniqueAddressesChart
            key="total-unique-addresses"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("total-unique-addresses")}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
      {
        id: "price",
        title: "ETH Price Charts",
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
          <EthPriceChart
            key="eth-price"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("eth-price")}
            isLoading={globalDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
    ],
    [
      aggregatedMetrics,
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

  const currentSectionOption =
    selectedSection.value === "price" && !isMainnet
      ? "all"
      : selectedSection.value;
  const availableSections = sections.filter(
    (section) => section.id !== "price" || isMainnet === true
  );
  const displayedSections =
    currentSectionOption === "all"
      ? availableSections
      : availableSections.filter((s) => s.id === currentSectionOption);

  const handleSectionChange = useCallback(
    (option: SectionOption) => {
      updateState({
        section: option !== DEFAULT_SECTION ? option.value : undefined,
      });
    },
    [updateState]
  );

  useEffect(() => {
    setSelectedSection(
      SECTION_OPTIONS.find(
        (s) =>
          s.value === state?.section &&
          (s.value !== "price" || isMainnet === true)
      ) ?? DEFAULT_SECTION
    );
  }, [state?.section, isMainnet]);

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <SeoMetaTags
        title="Stats Overview"
        description="Explore comprehensive metrics and stats about blobs, blocks, transactions, gas usage, fees, etc."
      />
      <div className="flex flex-col gap-8">
        <Header>Stats Overview</Header>
        <Card>
          <div className="flex w-full flex-wrap items-center justify-start gap-4">
            <div className="w-36">
              <StatsSectionSelector
                options={SECTION_OPTIONS.filter(
                  (option) => option.value !== "price" || isMainnet === true
                )}
                selected={selectedSection}
                onChange={handleSectionChange}
              />
            </div>
            <div className="w-64">
              <RollupSelector
                selected={selectedRollups}
                onChange={(newRollups) => setSelectedRollups(newRollups ?? [])}
              />
            </div>
          </div>
        </Card>
        <div className="flex flex-col gap-8">
          <SubHeader>Overall Metrics</SubHeader>
          <Scrollable displayScrollbar>
            <div
              className={
                currentSectionOption === "all"
                  ? "grid grid-flow-col grid-rows-3 gap-6"
                  : "flex flex-wrap gap-6"
              }
            >
              {displayedSections
                .flatMap((s) => s.metrics)
                .map((p) => (
                  <div key={p.name} className="w-screen sm:w-[260px]">
                    <MetricCard {...p} />
                  </div>
                ))}
            </div>
          </Scrollable>
        </div>
        <div className="mt-4 flex flex-col gap-8">
          {displayedSections.map(({ title: section, charts }) => (
            <div key={section} className="flex flex-col gap-8">
              <SubHeader>{section}</SubHeader>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 [&>div]:w-full">
                {charts.map((chart, index) => (
                  <div key={index} className="h-full">
                    {chart}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Stats;
