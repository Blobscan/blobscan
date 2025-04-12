import type { ReactNode } from "react";
import { useState } from "react";

import type { TimeFrame } from "@blobscan/api/src/middlewares/withTimeFrame";

import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
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
import { Header } from "~/components/Header";
import { api } from "~/api-client";
import type { DailyStats } from "~/types";

const Stats = function () {
  return (
    <div className="flex flex-col gap-8">
      <OverallStats />
      <Charts />
    </div>
  );
};

function OverallStats() {
  const { data: overallStats } = api.stats.getOverallStats.useQuery();

  return (
    <div className="flex flex-col gap-4">
      <Header>Stats Overview</Header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* BLOBS */}

        <MetricCard
          name="Total Blobs"
          metric={{
            value: overallStats?.totalBlobs,
          }}
        />

        <MetricCard
          name="Total Blob Size"
          metric={{
            value: overallStats?.totalBlobSize,
            type: "bytes",
          }}
        />

        <MetricCard
          name="Total Unique Blobs"
          metric={{
            value: overallStats?.totalUniqueBlobs,
          }}
        />

        {/* BLOCKS */}

        <MetricCard
          name="Total Blocks"
          metric={{
            value: overallStats?.totalBlocks,
          }}
        />

        <MetricCard
          name="Total Blob Gas Used"
          metric={{
            value: overallStats?.totalBlobGasUsed,
            type: "ethereum",
          }}
        />

        <MetricCard
          name="Total Blob Fees"
          metric={{
            value: overallStats?.totalBlobFee,
            type: "ethereum",
          }}
        />

        <MetricCard
          name="Avg. Blob Gas Price"
          metric={
            overallStats
              ? {
                  value: overallStats.avgBlobGasPrice,
                  type: "ethereum",
                  numberFormatOpts: {
                    maximumFractionDigits: 9,
                  },
                }
              : undefined
          }
        />

        <MetricCard
          name="Total Tx Fees Saved"
          metric={
            overallStats
              ? {
                  value:
                    BigInt(overallStats.totalBlobAsCalldataFee) -
                    BigInt(overallStats.totalBlobFee),
                  type: "ethereum",
                }
              : undefined
          }
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
        />

        <MetricCard
          name="Total Gas Saved"
          metric={{
            value: overallStats
              ? BigInt(overallStats.totalBlobAsCalldataGasUsed) -
                BigInt(overallStats.totalBlobGasUsed)
              : undefined,
          }}
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
        />

        {/* TX */}

        <MetricCard
          name="Total Transactions"
          metric={{
            value: overallStats?.totalTransactions,
          }}
        />

        <MetricCard
          name="Total Unique Receivers"
          metric={{
            value: overallStats?.totalUniqueReceivers,
          }}
        />

        <MetricCard
          name="Total Unique Senders"
          metric={{
            value: overallStats?.totalUniqueSenders,
          }}
        />

        <MetricCard
          name="Avg. Max Blob Gas Fee"
          metric={{
            value: overallStats?.avgMaxBlobGasFee,
            type: "ethereum",
          }}
        />
      </div>
    </div>
  );
}

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

function Charts() {
  const [selectedSection, setSelectedSection] = useState<SectionOption>(
    SECTION_OPTIONS[0]
  );
  const [timeFrameOption, setTimeFrameOption] = useState<TimeFrameOption>(
    TIME_FRAME_OPTIONS[0]
  );
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
  const { days, series, totalSeries } = dailyStats || {};
  const sections: { section: Section; charts: ReactNode[] }[] = [
    {
      section: "Blob",
      charts: [
        <DailyBlobsChart
          key="daily-blobs"
          days={days}
          series={series?.totalBlobs}
        />,
        <DailyBlobSizeChart
          key="daily-blob-size"
          days={days}
          series={series?.totalBlobSize}
        />,
      ],
    },
    {
      section: "Block",
      charts: [
        <DailyBlocksChart
          key="daily-blocks"
          days={days}
          series={series?.totalBlocks}
        />,
      ],
    },
    {
      section: "Gas",
      charts: [
        <DailyBlobGasUsedChart
          key="daily-blob-gas-used"
          days={days}
          series={series?.totalBlobGasUsed}
        />,
        <DailyAvgBlobGasPriceChart
          key="daily-avg-blob-gas-price"
          days={days}
          series={totalSeries?.avgBlobGasPrice}
        />,
        <DailyBlobGasComparisonChart
          key="daily-blob-gas-comparison"
          days={days}
          series={
            totalSeries
              ? {
                  totalBlobGasUsed: totalSeries.totalBlobGasUsed,
                  totalBlobAsCalldataGasUsed:
                    totalSeries.totalBlobAsCalldataGasUsed,
                }
              : undefined
          }
        />,
      ],
    },
    {
      section: "Fee",
      charts: [
        <DailyBlobFeeChart
          key="daily-blob-fee"
          days={days}
          series={series?.totalBlobFee}
        />,
        <DailyAvgBlobFeeChart
          key="daily-avg-blob-fee"
          days={days}
          series={totalSeries?.avgBlobFee}
        />,
        <DailyAvgMaxBlobGasFeeChart
          key="daily-avg-max-blob-gas-fee"
          days={days}
          series={totalSeries?.avgMaxBlobGasFee}
        />,
      ],
    },
    {
      section: "Transaction",
      charts: [
        <DailyTransactionsChart
          key="daily-transactions"
          days={days}
          series={series?.totalTransactions}
        />,
        <DailyUniqueAddressesChart
          key="daily-unique-addresses"
          days={days}
          series={
            totalSeries
              ? {
                  totalUniqueReceivers: totalSeries.totalUniqueReceivers,
                  totalUniqueSenders: totalSeries.totalUniqueSenders,
                }
              : undefined
          }
        />,
      ],
    },
  ];
  const currentSectionOption = selectedSection?.value ?? "All";
  const displayedSections =
    currentSectionOption === "All"
      ? sections
      : sections.filter((s) => s.section === currentSectionOption);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="flex flex-wrap items-center justify-start gap-4">
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
        </div>
      </Card>

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
  );
}

export default Stats;
