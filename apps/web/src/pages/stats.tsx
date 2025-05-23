import type { ReactNode } from "react";
import React, { useMemo, useState } from "react";
import type { NextPage } from "next";

import type { TimeFrame } from "@blobscan/api/src/middlewares/withTimeFrame";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { DailyBlobsChart, DailyBlobSizeChart } from "~/components/Charts/Blob";
import {
  DailyAvgBlobFeeChart,
  DailyAvgBlobGasPriceChart,
  DailyBlobFeeChart,
  DailyBlobGasComparisonChart,
  DailyBlobGasUsedChart,
  DailyBlocksChart,
} from "~/components/Charts/Block";
import {
  DailyAvgMaxBlobGasFeeChart,
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { convertStatsToChartSeries } from "~/components/Charts/helpers";
import type { Option } from "~/components/Dropdown";
import { Dropdown } from "~/components/Dropdown";
import { RollupFilter } from "~/components/Filters/RollupFilter";
import type { RollupOption } from "~/components/Filters/RollupFilter";
import { Header } from "~/components/Header";
import { Scrollable } from "~/components/Scrollable";
import { api } from "~/api-client";
import { useAggregateOverallStats } from "~/hooks/useAggregateOverallStats";
import type { DailyStats } from "~/types";
import { splitArrayIntoChunks } from "~/utils";

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
  const [selectedSection, setSelectedSection] = useState<SectionOption>(
    SECTION_OPTIONS[0]
  );
  const [timeFrameOption, setTimeFrameOption] = useState<TimeFrameOption>(
    TIME_FRAME_OPTIONS[1]
  );
  const [selectedRollups, setSelectedRollups] = useState<RollupOption[]>([]);
  const { data: dailyStatsData } = api.stats.getDailyStats.useQuery(
    {
      categories: "all",
      rollups: "all",
      timeFrame: timeFrameOption?.value,
      sort: "asc",
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
  const aggregatedOverallStats = useAggregateOverallStats(
    selectedRollups.map((r) => r.value),
    allOverallStats
  );
  const selectedRollupOrTotalSeries = selectedRollups.length
    ? selectedRollupSeries
    : totalSeries;
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
            value: aggregatedOverallStats?.totalBlobs,
          },
        },
        {
          name: "Total Blob Size",
          metric: {
            value: aggregatedOverallStats?.totalBlobSize,
            type: "bytes",
          },
        },
        {
          name: "Total Unique Blobs",
          metric: {
            value: aggregatedOverallStats?.totalUniqueBlobs,
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
      ],
    },
    {
      section: "Block",
      metrics: [
        {
          name: "Total Blocks",
          metric: {
            value: aggregatedOverallStats?.totalBlocks,
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
            value: aggregatedOverallStats?.totalBlobGasUsed,
            type: "ethereum",
          },
        },
        {
          name: "Total Gas Saved",
          metric: {
            value: aggregatedOverallStats
              ? aggregatedOverallStats.totalBlobAsCalldataGasUsed -
                aggregatedOverallStats.totalBlobGasUsed
              : undefined,
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
                value: aggregatedOverallStats.avgBlobGasPrice,
                type: "ethereum",
                numberFormatOpts: {
                  maximumFractionDigits: 9,
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
            value: aggregatedOverallStats?.totalBlobFee,
            type: "ethereum",
          },
        },
        {
          name: "Total Tx Fees Saved",
          metric: aggregatedOverallStats
            ? {
                value:
                  aggregatedOverallStats.totalBlobAsCalldataFee -
                  aggregatedOverallStats.totalBlobFee,
                type: "ethereum",
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
            value: aggregatedOverallStats?.avgMaxBlobGasFee,
            type: "ethereum",
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
            value: aggregatedOverallStats?.totalTransactions,
          },
        },
        {
          name: "Total Unique Receivers",
          metric: {
            value: aggregatedOverallStats?.totalUniqueReceivers,
          },
        },
        {
          name: "Total Unique Senders",
          metric: {
            value: aggregatedOverallStats?.totalUniqueSenders,
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
          <Dropdown
            width="w-48"
            options={SECTION_OPTIONS}
            selected={selectedSection}
            onChange={(option) => {
              setSelectedSection(option);
            }}
          />
          <Dropdown
            options={TIME_FRAME_OPTIONS}
            selected={timeFrameOption}
            onChange={(option) => {
              setTimeFrameOption(option);
            }}
          />
          <RollupFilter
            selected={selectedRollups}
            onChange={(newRollups) => setSelectedRollups(newRollups ?? [])}
          />
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <OverallMetricWrapper>
          <div className="flex flex-row gap-4">
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
