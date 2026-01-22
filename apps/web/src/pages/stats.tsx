import type { ReactNode } from "react";
import React, { useState } from "react";
import type { NextPage } from "next";

import type { TimeFrame } from "@blobscan/api";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import {
  DailyAvgBlobFeeChart,
  DailyBlobFeeChart,
  DailyBlobGasComparisonChart,
  DailyBlobGasUsedChart,
  DailyBlobSizeChart,
  DailyBlobUsageSizeChart,
  DailyBlobsChart,
  DailyBlocksChart,
  DailyAvgMaxBlobGasFeeChart,
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
  DailyAvgBlobGasPriceChart,
} from "~/components/Charts";
import { convertTimeseriesToChartData } from "~/components/Charts/helpers";
import { Header } from "~/components/Header";
import { Scrollable } from "~/components/Scrollable";
import { RollupSelector } from "~/components/Selectors";
import type { RollupSelectorOption } from "~/components/Selectors";
import type { SelectOption } from "~/components/Selects";
import { Listbox } from "~/components/Selects";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import { useChain } from "~/hooks/useChain";
import { calculatePercentage, splitArrayIntoChunks } from "~/utils";

type Section = "All" | "Blob" | "Block" | "Gas" | "Fee" | "Transaction";

type SectionOption = SelectOption<Section>;

type TimeFrameOption = SelectOption<TimeFrame>;

const TIME_FRAME_OPTIONS = [
  { label: "1 year", value: "365d" },
  { label: "6 months", value: "180d" },
  { label: "1 month", value: "30d" },
  { label: "7 days", value: "7d" },
  { label: "1 day", value: "1d" },
] as const;

const SECTION_OPTIONS = [
  { value: "All" },
  { value: "Blob" },
  { value: "Block" },
  { value: "Gas" },
  { value: "Fee" },
  { value: "Transaction" },
] as const;

const Stats: NextPage = function () {
  const chain = useChain();
  const [selectedSection, setSelectedSection] = useState<SectionOption>(
    SECTION_OPTIONS[0]
  );
  const [timeFrameOption, setTimeFrameOption] = useState<TimeFrameOption>(
    TIME_FRAME_OPTIONS[1]
  );
  const [selectedRollups, setSelectedRollups] = useState<
    RollupSelectorOption[]
  >([]);
  const { data: categorizedDailyChartData } = api.stats.getTimeseries.useQuery(
    {
      categories: "other",
      rollups: "all",
      timeFrame: timeFrameOption?.value,
      sort: "asc",
      stats:
        "totalBlobs,totalBlobSize,totalBlobUsageSize,totalBlobGasUsed,totalBlobFee,totalTransactions,totalUniqueReceivers,totalUniqueSenders,totalBlobAsCalldataGasUsed",
    },
    {
      refetchOnWindowFocus: false,
      select: ({ data }) => convertTimeseriesToChartData(data),
    }
  );
  const { data: globalDailyChartData } = api.stats.getTimeseries.useQuery(
    {
      timeFrame: timeFrameOption?.value,
      sort: "asc",
      stats:
        "avgBlobGasPrice,avgBlobFee,avgBlobMaxFee,totalBlocks,totalUniqueReceivers,totalUniqueSenders,totalBlobAsCalldataGasUsed,totalBlobGasUsed",
    },
    {
      refetchOnWindowFocus: false,
      select: ({ data }) => convertTimeseriesToChartData(data),
    }
  );
  const { data: allOverallStats } = api.stats.getOverallStats.useQuery();

  const aggregatedOverallStats = useAggregateOverallStats(
    selectedRollups.map((r) => r.value),
    allOverallStats
  );
  const {
    timestamps: categorizedChartTimestamps,
    metricSeries: categorizedChartMetricSeries,
  } = categorizedDailyChartData || {};
  const {
    timestamps: globalChartTimestamps,
    metricSeries: globalChartMetricSeries,
  } = globalDailyChartData || {};

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
              value: aggregatedOverallStats?.totalBlobs,
            },
          },
        },
        {
          name: "Total Blob Size",
          metric: {
            primary: {
              value: aggregatedOverallStats?.totalBlobSize,
              type: "bytes",
            },
          },
        },
        {
          name: "Total Blob Usage Size",
          metric: {
            primary: {
              value: aggregatedOverallStats?.totalBlobUsageSize,
              type: "bytes",
            },
          },
        },
        {
          name: "Avg. Blob Usage Size",
          metric: {
            primary: {
              value: aggregatedOverallStats?.avgBlobUsageSize,
              type: "bytes",
            },
            secondary:
              blobSize && aggregatedOverallStats?.avgBlobUsageSize
                ? {
                    value: calculatePercentage(
                      aggregatedOverallStats?.avgBlobUsageSize,
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
              value: aggregatedOverallStats?.totalUniqueBlobs,
            },
          },
        },
      ],
      charts: [
        <DailyBlobsChart
          key="daily-blobs"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalBlobs}
          showLegend
        />,
        <DailyBlobSizeChart
          key="daily-blob-size"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalBlobSize}
          showLegend
        />,
        <DailyBlobUsageSizeChart
          key="daily-blob-usage-size"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalBlobUsageSize}
          showLegend
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
              value: aggregatedOverallStats?.totalBlocks,
            },
          },
        },
      ],
      charts: [
        <DailyBlocksChart
          key="daily-blocks"
          days={globalChartTimestamps}
          series={globalChartMetricSeries?.totalBlocks}
          showLegend
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
              value: aggregatedOverallStats?.totalBlobGasUsed,
              type: "ethereum",
            },
          },
        },
        {
          name: "Total Gas Saved",
          metric: {
            primary: {
              value: aggregatedOverallStats
                ? aggregatedOverallStats.totalBlobAsCalldataGasUsed -
                  aggregatedOverallStats.totalBlobGasUsed
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
          metric: aggregatedOverallStats
            ? {
                primary: {
                  value: aggregatedOverallStats.avgBlobGasPrice,
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
        <DailyBlobGasUsedChart
          key="daily-blob-gas-used"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalBlobGasUsed}
          showLegend
        />,
        <DailyAvgBlobGasPriceChart
          key="daily-avg-blob-gas-price"
          days={globalChartTimestamps}
          series={globalChartMetricSeries?.avgBlobGasPrice}
          showLegend
        />,
        <DailyBlobGasComparisonChart
          key="daily-blob-gas-comparison"
          days={globalChartTimestamps}
          series={globalChartMetricSeries}
          showLegend
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
              value: aggregatedOverallStats?.totalBlobFee,
              type: "ethereum",
            },
          },
        },
        {
          name: "Total Tx Fees Saved",
          metric: aggregatedOverallStats
            ? {
                primary: {
                  value:
                    aggregatedOverallStats.totalBlobAsCalldataFee -
                    aggregatedOverallStats.totalBlobFee,
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
              value: aggregatedOverallStats?.avgMaxBlobGasFee,
              type: "ethereum",
            },
          },
        },
      ],
      charts: [
        <DailyBlobFeeChart
          key="daily-blob-fee"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalBlobFee}
          showLegend
        />,
        <DailyAvgBlobFeeChart
          key="daily-avg-blob-fee"
          days={globalChartTimestamps}
          series={globalChartMetricSeries?.avgBlobFee}
          showLegend
        />,
        <DailyAvgMaxBlobGasFeeChart
          key="daily-avg-max-blob-gas-fee"
          days={globalChartTimestamps}
          series={globalChartMetricSeries?.avgBlobMaxFee}
          showLegend
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
              value: aggregatedOverallStats?.totalTransactions,
            },
          },
        },
        {
          name: "Total Unique Receivers",
          metric: {
            primary: {
              value: aggregatedOverallStats?.totalUniqueReceivers,
            },
          },
        },
        {
          name: "Total Unique Senders",
          metric: {
            primary: {
              value: aggregatedOverallStats?.totalUniqueSenders,
            },
          },
        },
      ],
      charts: [
        <DailyTransactionsChart
          key="daily-transactions"
          days={categorizedChartTimestamps}
          series={categorizedChartMetricSeries?.totalTransactions}
          showLegend
        />,
        <DailyUniqueAddressesChart
          key="daily-unique-addresses"
          days={globalChartTimestamps}
          series={globalChartMetricSeries}
          showLegend
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
          <Listbox
            options={TIME_FRAME_OPTIONS}
            selected={timeFrameOption}
            onChange={(option: TimeFrameOption) => {
              setTimeFrameOption(option);
            }}
          />
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
          <div className="flex w-full flex-row gap-4">
            {splitArrayIntoChunks(
              displayedSections.flatMap((s) => s.metrics),
              2
            ).map((metricProps, i) => (
              <div key={i} className="flex flex-col gap-4">
                {metricProps.map((p) => (
                  <div key={p.name} className="w-[240px]">
                    <MetricCard {...p} />
                  </div>
                ))}
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
