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
import type { DailyStats, OverallStats } from "~/types";
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
  const { data: dailyStats } = api.stats.getDailyStats.useQuery(
    {
      categories: "all",
      rollups: "all",
      timeFrame: timeFrameOption?.value,
      sort: "asc",
    },
    {
      select: (data) =>
        convertStatsToChartSeries(data as Required<DailyStats>[]),
      refetchOnWindowFocus: false,
    }
  );
  const { data: allOverallStats } = api.stats.getOverallStats.useQuery(
    {
      categories: "all",
      rollups: "all",
    },
    {
      refetchOnWindowFocus: false,
    }
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
  const overallStats = useMemo(() => {
    const rollups = selectedRollups.map((r) => r.value);

    if (!allOverallStats) {
      return;
    }

    if (!rollups.length) {
      return allOverallStats.find(
        (s) => s.category === null && s.rollup === null
      );
    }

    const selectedOverallStats = allOverallStats.filter((s) =>
      s.rollup !== null ? rollups.includes(s.rollup) : false
    );

    return selectedOverallStats.reduce(
      (acc, s) => {
        acc.avgBlobAsCalldataFee =
          acc.avgBlobAsCalldataFee === 0
            ? s.avgBlobAsCalldataFee
            : (acc.avgBlobAsCalldataFee + s.avgBlobAsCalldataFee) / 2;
        acc.avgBlobAsCalldataMaxFee =
          acc.avgBlobAsCalldataMaxFee === 0
            ? s.avgBlobAsCalldataMaxFee
            : (acc.avgBlobAsCalldataMaxFee + s.avgBlobAsCalldataMaxFee) / 2;
        acc.avgBlobFee =
          acc.avgBlobFee === 0
            ? s.avgBlobFee
            : (acc.avgBlobFee + s.avgBlobFee) / 2;
        acc.avgBlobGasPrice =
          acc.avgBlobGasPrice === 0
            ? s.avgBlobGasPrice
            : (acc.avgBlobGasPrice + s.avgBlobGasPrice) / 2;
        acc.avgBlobMaxFee =
          acc.avgBlobMaxFee === 0
            ? s.avgBlobMaxFee
            : (acc.avgBlobMaxFee + s.avgBlobMaxFee) / 2;
        acc.avgMaxBlobGasFee =
          acc.avgMaxBlobGasFee === 0
            ? s.avgMaxBlobGasFee
            : (acc.avgMaxBlobGasFee + s.avgMaxBlobGasFee) / 2;
        acc.totalBlobAsCalldataFee += s.totalBlobAsCalldataFee;
        acc.totalBlobAsCalldataGasUsed += s.totalBlobAsCalldataGasUsed;
        acc.totalBlobAsCalldataMaxFees += s.totalBlobAsCalldataMaxFees;
        acc.totalBlobGasPrice += s.totalBlobGasPrice;
        acc.totalBlobFee += s.totalBlobFee;
        acc.totalBlobGasUsed += s.totalBlobGasUsed;
        acc.totalBlobMaxFees += s.totalBlobMaxFees;
        acc.totalBlobMaxGasFees += s.totalBlobMaxGasFees;
        acc.totalBlobs += s.totalBlobs;
        acc.totalBlobSize += s.totalBlobSize;
        acc.totalBlocks += s.totalBlocks;
        acc.totalTransactions += s.totalTransactions;
        acc.totalUniqueBlobs += s.totalUniqueBlobs;
        acc.totalUniqueReceivers += s.totalUniqueReceivers;
        acc.totalUniqueSenders += s.totalUniqueSenders;

        return acc;
      },
      {
        category: null,
        rollup: null,
        avgBlobAsCalldataFee: 0,
        avgBlobAsCalldataMaxFee: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgBlobMaxFee: 0,
        avgMaxBlobGasFee: 0,
        totalBlobAsCalldataFee: BigInt(0),
        totalBlobAsCalldataGasUsed: BigInt(0),
        totalBlobAsCalldataMaxFees: BigInt(0),
        totalBlobGasPrice: BigInt(0),
        totalBlobFee: BigInt(0),
        totalBlobGasUsed: BigInt(0),
        totalBlobMaxFees: BigInt(0),
        totalBlobMaxGasFees: BigInt(0),
        totalBlobs: 0,
        totalBlobSize: BigInt(0),
        totalBlocks: 0,
        totalTransactions: 0,
        totalUniqueBlobs: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
      } satisfies Omit<OverallStats, "updatedAt">
    );
  }, [allOverallStats, selectedRollups]);
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
            value: overallStats?.totalBlobs,
          },
        },
        {
          name: "Total Blob Size",
          metric: {
            value: overallStats?.totalBlobSize,
            type: "bytes",
          },
        },
        {
          name: "Total Unique Blobs",
          metric: {
            value: overallStats?.totalUniqueBlobs,
          },
        },
      ],
      charts: [
        <DailyBlobsChart
          key="daily-blobs"
          days={days}
          series={selectedRollupSeries?.totalBlobs}
        />,
        <DailyBlobSizeChart
          key="daily-blob-size"
          days={days}
          series={selectedRollupSeries?.totalBlobSize}
        />,
      ],
    },
    {
      section: "Block",
      metrics: [
        {
          name: "Total Blocks",
          metric: {
            value: overallStats?.totalBlocks,
          },
        },
      ],
      charts: [
        <DailyBlocksChart
          key="daily-blocks"
          days={days}
          series={selectedRollupSeries?.totalBlocks}
        />,
      ],
    },
    {
      section: "Gas",
      metrics: [
        {
          name: "Total Blob Gas Used",
          metric: {
            value: overallStats?.totalBlobGasUsed,
            type: "ethereum",
          },
        },
        {
          name: "Total Gas Saved",
          metric: {
            value: overallStats
              ? overallStats.totalBlobAsCalldataGasUsed -
                overallStats.totalBlobGasUsed
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
          metric: overallStats
            ? {
                value: overallStats.avgBlobGasPrice,
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
        />,
        <DailyAvgBlobGasPriceChart
          key="daily-avg-blob-gas-price"
          days={days}
          series={selectedRollupOrTotalSeries?.avgBlobGasPrice}
        />,
        <DailyBlobGasComparisonChart
          key="daily-blob-gas-comparison"
          days={days}
          series={selectedRollupOrTotalSeries}
        />,
      ],
    },
    {
      section: "Fee",
      metrics: [
        {
          name: "Total Blob Fees",
          metric: {
            value: overallStats?.totalBlobFee,
            type: "ethereum",
          },
        },
        {
          name: "Total Tx Fees Saved",
          metric: overallStats
            ? {
                value:
                  overallStats.totalBlobAsCalldataFee -
                  overallStats.totalBlobFee,
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
            value: overallStats?.avgMaxBlobGasFee,
            type: "ethereum",
          },
        },
      ],
      charts: [
        <DailyBlobFeeChart
          key="daily-blob-fee"
          days={days}
          series={selectedRollupSeries?.totalBlobFee}
        />,
        <DailyAvgBlobFeeChart
          key="daily-avg-blob-fee"
          days={days}
          series={selectedRollupOrTotalSeries?.avgBlobFee}
        />,
        <DailyAvgMaxBlobGasFeeChart
          key="daily-avg-max-blob-gas-fee"
          days={days}
          series={selectedRollupOrTotalSeries?.avgMaxBlobGasFee}
        />,
      ],
    },
    {
      section: "Transaction",
      metrics: [
        {
          name: "Total Transactions",
          metric: {
            value: overallStats?.totalTransactions,
          },
        },
        {
          name: "Total Unique Receivers",
          metric: {
            value: overallStats?.totalUniqueReceivers,
          },
        },
        {
          name: "Total Unique Senders",
          metric: {
            value: overallStats?.totalUniqueSenders,
          },
        },
      ],
      charts: [
        <DailyTransactionsChart
          key="daily-transactions"
          days={days}
          series={selectedRollupSeries?.totalTransactions}
        />,
        <DailyUniqueAddressesChart
          key="daily-unique-addresses"
          days={days}
          series={selectedRollupOrTotalSeries}
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
