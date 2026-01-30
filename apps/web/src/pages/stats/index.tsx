import type { ReactNode } from "react";
import React, { useState } from "react";
import type { NextPage } from "next";

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
  DailyAvgBlobGasPriceChart,
} from "~/components/Charts";
import { transformToDatasets } from "~/components/Charts/helpers";
import { Header } from "~/components/Header";
import { Scrollable } from "~/components/Scrollable";
import { RollupSelector } from "~/components/Selectors";
import type { RollupSelectorOption } from "~/components/Selectors";
import type { SelectOption } from "~/components/Selects";
import { Listbox } from "~/components/Selects";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import { useChain } from "~/hooks/useChain";
import type { TimeseriesMetric } from "~/types";
import { calculatePercentage } from "~/utils";

type Section = "All" | "Blob" | "Block" | "Gas" | "Fee" | "Transaction";

type SectionOption = SelectOption<Section>;

const SECTION_OPTIONS = [
  { value: "All" },
  { value: "Blob" },
  { value: "Block" },
  { value: "Gas" },
  { value: "Fee" },
  { value: "Transaction" },
] as const;

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

const Stats: NextPage = function () {
  const chain = useChain();
  const [selectedSection, setSelectedSection] = useState<SectionOption>(
    SECTION_OPTIONS[0]
  );

  const [selectedRollups, setSelectedRollups] = useState<
    RollupSelectorOption[]
  >([]);
  const { data: categorizedChartDatasets } = api.stats.getTimeseries.useQuery(
    {
      categories: "other",
      rollups: "all",
      timeFrame: "15d",
      sort: "asc",
      metrics: CATEGORIZED_METRICS.join(","),
    },
    {
      refetchOnWindowFocus: false,
      select: ({ data }) => transformToDatasets(data),
    }
  );
  const { data: globalChartDatasets } = api.stats.getTimeseries.useQuery(
    {
      timeFrame: "15d",
      sort: "asc",
      metrics: GLOBAL_METRICS.join(","),
    },
    {
      refetchOnWindowFocus: false,
      select: ({ data }) => transformToDatasets(data)[0],
    }
  );

  const { data: allOverallStats } = api.stats.getOverall.useQuery(undefined, {
    select: ({ data }) => data,
  });

  const aggregatedMetrics = useAggregateOverallStats(
    selectedRollups.map((r) => r.value),
    allOverallStats
  );

  const blobSize = chain
    ? chain.latestFork.blobParams.bytesPerFieldElement *
      chain.latestFork.blobParams.fieldElementsPerBlob
    : undefined;
  const sections: {
    section: Section;
    metrics: MetricCardProps[];
    charts: ReactNode[];
  }[] = [
    {
      section: "Blob",
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
          datasets={categorizedChartDatasets}
          compact
        />,
        <TotalBlobSizeChart
          key="daily-blob-size"
          datasets={categorizedChartDatasets}
          compact
        />,
        <TotalBlobUsageSizeChart
          key="daily-blob-usage-size"
          datasets={categorizedChartDatasets}
          compact
        />,
      ],
    },
    {
      section: "Block",
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
          key="daily-blocks"
          dataset={globalChartDatasets}
          compact
        />,
      ],
    },
    {
      section: "Gas",
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
          metric: aggregatedMetrics
            ? {
                primary: {
                  value: aggregatedMetrics.avgBlobGasPrice,
                  type: "ethereum",
                  numberFormatOpts: {
                    maximumFractionDigits: 9,
                  },
                },
              }
            : undefined,
        },
      ],
      charts: [
        <TotalBlobGasUsedChart
          key="daily-blob-gas-used"
          datasets={categorizedChartDatasets}
          compact
        />,
        <DailyAvgBlobGasPriceChart
          key="daily-avg-blob-gas-price"
          dataset={globalChartDatasets}
          compact
        />,
        <TotalBlobGasComparisonChart
          key="daily-blob-gas-comparison"
          dataset={globalChartDatasets}
          compact
        />,
      ],
    },
    {
      section: "Fee",
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
          metric: aggregatedMetrics
            ? {
                primary: {
                  value:
                    aggregatedMetrics.totalBlobAsCalldataFee -
                    aggregatedMetrics.totalBlobFee,
                  type: "ethereum",
                },
              }
            : undefined,
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
          key="daily-blob-fee"
          datasets={categorizedChartDatasets}
          compact
        />,
        <AvgBlobBaseFeeChart
          key="daily-avg-blob-fee"
          dataset={globalChartDatasets}
          compact
        />,
      ],
    },
    {
      section: "Transaction",
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
          key="daily-transactions"
          datasets={categorizedChartDatasets}
          compact
        />,
        <TotalUniqueAddressesChart
          key="daily-unique-addresses"
          dataset={globalChartDatasets}
          compact
        />,
      ],
    },
  ];
  const currentSectionOption = selectedSection?.value ?? "All";
  const displayedSections =
    currentSectionOption === "All"
      ? sections
      : sections.filter((s) => s.section === currentSectionOption);
  const OverallMetricWrapper =
    currentSectionOption === "All" ? Scrollable : React.Fragment;

  return (
    <div className="flex flex-col gap-8">
      <Header>Stats Overview</Header>
      <Card>
        <div className="flex w-full flex-wrap items-center justify-start gap-4">
          <div className="w-48">
            <Listbox
              options={SECTION_OPTIONS}
              selected={selectedSection}
              onChange={(option: SectionOption) => {
                setSelectedSection(option);
              }}
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
      <div className="flex flex-col gap-4">
        <OverallMetricWrapper displayScrollbar>
          <div className="grid grid-flow-col grid-rows-3 gap-4">
            {displayedSections
              .flatMap((s) => s.metrics)
              .map((p) => (
                <div key={p.name} className="w-[85vw] sm:w-[260px]">
                  <MetricCard {...p} />
                </div>
              ))}
          </div>
        </OverallMetricWrapper>
      </div>
      <div className="flex flex-col gap-8">
        {displayedSections.map(({ section, charts }) => (
          <div key={section} className="flex flex-col gap-4">
            <Header>{section}</Header>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>div]:w-full">
              {charts.map((chart, index) => (
                <Card key={index} className="h-full">
                  {chart}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stats;
