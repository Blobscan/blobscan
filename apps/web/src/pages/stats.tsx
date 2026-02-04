import type { ReactNode } from "react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import {
  AvgBlobBaseFeeChart,
  TotalBlobBaseFeesChart,
  TotalBlobGasComparisonChart,
  TotalBlobGasUsedChart,
  TotalBlobSizeChart,
  TotalBlobUsageSizeChart,
  TotalBlobsChart,
  TotalBlocksChart,
  TotalTransactionsChart,
  TotalUniqueAddressesChart,
  AvgBlobGasPriceChart,
} from "~/components/Charts";
import type { ChartBaseProps } from "~/components/Charts/ChartBase";
import { transformToDatasets } from "~/components/Charts/helpers";
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
  SECTION_OPTIONS,
  StatsSectionSelector,
} from "~/components/Selectors/StatsSectionSelector";
import { SubHeader } from "~/components/SubHeader";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import { useChain } from "~/hooks/useChain";
import { useQueryParams } from "~/hooks/useQueryParams";
import type { TimeseriesMetric } from "~/types";
import { buildStatRoute, calculatePercentage } from "~/utils";

const CATEGORIZED_METRICS: TimeseriesMetric[] = [
  "totalBlobs",
  "totalBlobSize",
  "totalBlobUsageSize",
  "totalBlobGasUsed",
  "totalBlobFee",
  "totalTransactions",
  "totalUniqueReceivers",
  "totalUniqueSenders",
  "totalBlobAsCalldataGasUsed",
] as const;

const GLOBAL_METRICS: TimeseriesMetric[] = [
  "avgBlobGasPrice",
  "avgBlobFee",
  "avgBlobMaxFee",
  "totalBlocks",
  "totalUniqueReceivers",
  "totalUniqueSenders",
  "totalBlobAsCalldataGasUsed",
  "totalBlobGasUsed",
] as const;

function buildViewLink(metricRoute: string) {
  return (
    <Link href={buildStatRoute(metricRoute)}>
      <span className="text-sm">Full View</span>
    </Link>
  );
}

const SKELETON_OPTS: ChartBaseProps["skeletonOpts"] = {
  chart: {
    timeframe: "15d" as const,
  },
};

const Stats: NextPage = function () {
  const chain = useChain();
  const router = useRouter();
  const { statsSection } = useQueryParams();
  const [selectedSection, setSelectedSection] =
    useState<SectionOption>(DEFAULT_SECTION);

  const [selectedRollups, setSelectedRollups] = useState<
    RollupSelectorOption[]
  >([]);
  const {
    data: categorizedChartDatasets,
    isLoading: categorizedDatasetsLoading,
  } = api.stats.getTimeseries.useQuery(
    {
      categories: "other",
      rollups: "all",
      timeFrame: "15d",
      sort: "asc",
      metrics: CATEGORIZED_METRICS.join(","),
    },
    {
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      select: ({ data }) => transformToDatasets(data),
    }
  );
  const { data: globalChartDatasets, isLoading: globalDatasetsLoading } =
    api.stats.getTimeseries.useQuery(
      {
        timeFrame: "15d",
        sort: "asc",
        metrics: GLOBAL_METRICS.join(","),
      },
      {
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        select: ({ data }) => transformToDatasets(data)[0],
      }
    );
  const { data: allOverallStats } = api.stats.getOverall.useQuery(undefined, {
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
    return !selectedRollups.length
      ? categorizedChartDatasets
      : categorizedChartDatasets?.filter((dataset) =>
          selectedRollups.map((r) => `rollup-${r.value}`).includes(dataset.id)
        );
  }, [categorizedChartDatasets, selectedRollups]);

  const blobSize = chain
    ? chain.latestFork.blobParams.bytesPerFieldElement *
      chain.latestFork.blobParams.fieldElementsPerBlob
    : undefined;

  console.log(selectedCategorizedChartDatasets);
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
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobs,
              },
            },
          },
          {
            name: "Total Blob Size",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobSize,
                type: "bytes",
              },
            },
          },
          {
            name: "Total Blob Usage Size",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobUsageSize,
                type: "bytes",
              },
            },
          },
          {
            name: "Avg. Blob Usage Size",
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
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobGasUsed,
                type: "ethereum",
              },
            },
          },
          {
            name: "Total Gas Saved",
            metric: {
              primary: {
                value: aggregatedMetrics
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
            name: "Avg. Blob Gas Price",
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
          <AvgBlobGasPriceChart
            key="avg-blob-gas-price"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("avg-blob-gas-price")}
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
            metric: {
              primary: {
                value: aggregatedMetrics?.totalBlobFee,
                type: "ethereum",
              },
            },
          },
          {
            name: "Total Tx Fees Saved",
            metric: {
              primary: {
                value: aggregatedMetrics
                  ? aggregatedMetrics.totalBlobAsCalldataFee -
                    aggregatedMetrics.totalBlobFee
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
            metric: {
              primary: {
                value: aggregatedMetrics?.avgMaxBlobGasFee,
                type: "ethereum",
              },
            },
          },
        ],
        charts: [
          <TotalBlobBaseFeesChart
            key="total-blob-base-fees"
            dataset={selectedCategorizedChartDatasets}
            headerControls={buildViewLink("total-blob-base-fees")}
            isLoading={categorizedDatasetsLoading}
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
          <AvgBlobBaseFeeChart
            key="avg-blob-base-fee"
            dataset={globalChartDatasets}
            headerControls={buildViewLink("avg-blob-base-fee")}
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
            metric: {
              primary: {
                value: aggregatedMetrics?.totalTransactions,
              },
            },
          },
          {
            name: "Total Unique Receivers",
            metric: {
              primary: {
                value: aggregatedMetrics?.totalUniqueReceivers,
              },
            },
          },
          {
            name: "Total Unique Senders",
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
            skeletonOpts={SKELETON_OPTS}
            compact
          />,
        ],
      },
    ],
    [
      aggregatedMetrics,
      blobSize,
      selectedCategorizedChartDatasets,
      globalChartDatasets,
      categorizedDatasetsLoading,
      globalDatasetsLoading,
    ]
  );
  const currentSectionOption = selectedSection?.value ?? "all";
  const displayedSections =
    currentSectionOption === "all"
      ? sections
      : sections.filter((s) => s.id === currentSectionOption);

  const handleSectionChange = useCallback(
    (option: SectionOption) => {
      const queryParams = {
        ...router.query,
      };

      if (option !== DEFAULT_SECTION) {
        queryParams.section = option.value;
      } else {
        delete queryParams.section;
      }

      router.push({
        pathname: router.pathname,
        query: queryParams,
      });
    },
    [router]
  );

  useEffect(() => {
    setSelectedSection(
      SECTION_OPTIONS.find((s) => s.value === statsSection) ?? DEFAULT_SECTION
    );
  }, [statsSection]);

  return (
    <div className="flex flex-col gap-8">
      <Header>Stats Overview</Header>
      <Card>
        <div className="flex w-full flex-wrap items-center justify-start gap-4">
          <div className="w-36">
            <StatsSectionSelector
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
  );
};

export default Stats;
