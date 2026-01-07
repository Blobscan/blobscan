import type { ReactNode } from "react";
import React, { useMemo, useState } from "react";
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
import { convertStatsToChartSeries } from "~/components/Charts/helpers";
import type { Option } from "~/components/Dropdowns";
import { Listbox } from "~/components/Dropdowns";
import { RollupFilter } from "~/components/Filters/RollupFilter";
import type { RollupOption } from "~/components/Filters/RollupFilter";
import { Header } from "~/components/Header";
import { Scrollable } from "~/components/Scrollable";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import { useChain } from "~/hooks/useChain";
import type { DailyStats } from "~/types";
import { calculatePercentage, splitArrayIntoChunks } from "~/utils";

type Section = "All" | "Blob" | "Block" | "Gas" | "Fee" | "Transaction";

type SectionOption = Option<Section>;

type TimeFrameOption = Option<TimeFrame>;

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
  const [selectedRollups, setSelectedRollups] = useState<RollupOption[]>([]);
  const { data: dailyStatsData } = api.stats.getDailyStatsForCharts.useQuery(
    {
      categories: "all",
      rollups: "all",
      timeFrame: timeFrameOption?.value,
      sort: "asc",
      fields: [
        "totalBlobs",
        "totalBlobSize",
        "totalBlobUsageSize",
        "totalBlocks",
        "totalBlobGasUsed",
        "avgBlobGasPrice",
        "totalBlobFee",
        "avgBlobFee",
        "avgBlobUsageSize",
        "avgMaxBlobGasFee",
        "totalTransactions",
        "totalUniqueReceivers",
        "totalUniqueSenders",
        "totalBlobAsCalldataGasUsed",
      ],
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const { data: allOverallStats } = api.stats.getOverallStats.useQuery({
    categories: "all",
    rollups: "all",
  });
  const dailyStats = useMemo(
    () =>
      dailyStatsData
        ? convertStatsToChartSeries(dailyStatsData as Required<DailyStats>[])
        : undefined,
    [dailyStatsData]
  );

  const { days, series, totalSeries } = dailyStats || {};
  const selectedRollupSeries = useMemo(() => {
    const selectedRollupValues = selectedRollups.map((r) => r.value);

    if (!selectedRollupValues.length || !series) {
      return series;
    }

    return Object.entries(series).reduce((acc, [key, values]) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      acc[key] = values.filter((v) =>
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        v.name ? selectedRollupValues.includes(v.name) : false
      );

      return acc;
    }, {} as typeof series);
  }, [series, selectedRollups]);
  const overallAggr = useAggregateOverallStats(
    selectedRollups.map((r) => r.value),
    allOverallStats
  );
  const selectedRollupOrTotalSeries = selectedRollups.length
    ? selectedRollupSeries
    : totalSeries;
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
              value: overallAggr?.totalBlobs,
            },
          },
        },
        {
          name: "Total Blob Size",
          metric: {
            primary: {
              value: overallAggr?.totalBlobSize,
              type: "bytes",
            },
          },
        },
        {
          name: "Total Blob Usage Size",
          metric: {
            primary: {
              value: overallAggr?.totalBlobUsageSize,
              type: "bytes",
            },
          },
        },
        {
          name: "Avg. Blob Usage Size",
          metric: {
            primary: {
              value: overallAggr?.avgBlobUsageSize,
              type: "bytes",
            },
            secondary:
              blobSize && overallAggr?.avgBlobUsageSize
                ? {
                    value: calculatePercentage(
                      overallAggr?.avgBlobUsageSize,
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
              value: overallAggr?.totalUniqueBlobs,
            },
          },
        },
      ],
      charts: [
        <DailyBlobsChart
          key="daily-blobs"
          days={days}
          series={selectedRollupSeries?.totalBlobs}
          showLegend
        />,
        <DailyBlobSizeChart
          key="daily-blob-size"
          days={days}
          series={selectedRollupSeries?.totalBlobSize}
          showLegend
        />,
        <DailyBlobUsageSizeChart
          key="daily-blob-usage-size"
          days={days}
          series={selectedRollupSeries?.totalBlobUsageSize}
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
              value: overallAggr?.totalBlocks,
            },
          },
        },
      ],
      charts: [
        <DailyBlocksChart
          key="daily-blocks"
          days={days}
          series={selectedRollupSeries?.totalBlocks}
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
              value: overallAggr?.totalBlobGasUsed,
              type: "ethereum",
            },
          },
        },
        {
          name: "Total Gas Saved",
          metric: {
            primary: {
              value: overallAggr
                ? overallAggr.totalBlobAsCalldataGasUsed -
                  overallAggr.totalBlobGasUsed
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
          metric: overallAggr
            ? {
                primary: {
                  value: overallAggr.avgBlobGasPrice,
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
          days={days}
          series={selectedRollupSeries?.totalBlobGasUsed}
          showLegend
        />,
        <DailyAvgBlobGasPriceChart
          key="daily-avg-blob-gas-price"
          days={days}
          series={selectedRollupOrTotalSeries?.avgBlobGasPrice}
          showLegend
        />,
        <DailyBlobGasComparisonChart
          key="daily-blob-gas-comparison"
          days={days}
          series={selectedRollupOrTotalSeries}
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
              value: overallAggr?.totalBlobFee,
              type: "ethereum",
            },
          },
        },
        {
          name: "Total Tx Fees Saved",
          metric: overallAggr
            ? {
                primary: {
                  value:
                    overallAggr.totalBlobAsCalldataFee -
                    overallAggr.totalBlobFee,
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
              value: overallAggr?.avgMaxBlobGasFee,
              type: "ethereum",
            },
          },
        },
      ],
      charts: [
        <DailyBlobFeeChart
          key="daily-blob-fee"
          days={days}
          series={selectedRollupSeries?.totalBlobFee}
          showLegend
        />,
        <DailyAvgBlobFeeChart
          key="daily-avg-blob-fee"
          days={days}
          series={selectedRollupOrTotalSeries?.avgBlobFee}
          showLegend
        />,
        <DailyAvgMaxBlobGasFeeChart
          key="daily-avg-max-blob-gas-fee"
          days={days}
          series={selectedRollupOrTotalSeries?.avgMaxBlobGasFee}
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
              value: overallAggr?.totalTransactions,
            },
          },
        },
        {
          name: "Total Unique Receivers",
          metric: {
            primary: {
              value: overallAggr?.totalUniqueReceivers,
            },
          },
        },
        {
          name: "Total Unique Senders",
          metric: {
            primary: {
              value: overallAggr?.totalUniqueSenders,
            },
          },
        },
      ],
      charts: [
        <DailyTransactionsChart
          key="daily-transactions"
          days={days}
          series={selectedRollupSeries?.totalTransactions}
          showLegend
        />,
        <DailyUniqueAddressesChart
          key="daily-unique-addresses"
          days={days}
          series={selectedRollupOrTotalSeries}
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
              onChange={(option) => {
                setSelectedSection(option);
              }}
            />
          </div>
          <Listbox
            options={TIME_FRAME_OPTIONS}
            selected={timeFrameOption}
            onChange={(option) => {
              setTimeFrameOption(option);
            }}
          />
          <div className="w-64">
            <RollupFilter
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
