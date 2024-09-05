import type { ReactNode } from "react";
import { useState } from "react";

import type { TimeFrame } from "@blobscan/api/src/middlewares/withTimeFrame";

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
import { Dropdown } from "~/components/Dropdown";
import { Header } from "~/components/Header";
import { api } from "~/api-client";

const Stats = function () {
  return (
    <div className="flex flex-col gap-8">
      <OverallStats />
      <Charts />
    </div>
  );
};

function OverallStats() {
  const { data: overall } = api.stats.getAllOverallStats.useQuery();

  return (
    <div className="flex flex-col gap-4">
      <Header>Stats Overview</Header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* BLOBS */}

        <MetricCard
          name="Total Blobs"
          metric={{
            value: overall?.blob.totalBlobs,
          }}
        />

        <MetricCard
          name="Total Blob Size"
          metric={{
            value: overall ? BigInt(overall.blob.totalBlobSize) : undefined,
            type: "bytes",
          }}
        />

        <MetricCard
          name="Total Unique Blobs"
          metric={{
            value: overall?.blob.totalUniqueBlobs,
          }}
        />

        {/* BLOCKS */}

        <MetricCard
          name="Total Blocks"
          metric={{
            value: overall?.block.totalBlocks,
          }}
        />

        <MetricCard
          name="Total Blob Gas Used"
          metric={{
            value: overall ? BigInt(overall.block.totalBlobGasUsed) : undefined,
            type: "ethereum",
          }}
        />

        <MetricCard
          name="Total Blob Fees"
          metric={{
            value: overall ? BigInt(overall.block.totalBlobFee) : undefined,
            type: "ethereum",
          }}
        />

        <MetricCard
          name="Avg. Blob Gas Price"
          metric={
            overall
              ? {
                  value: overall.block.avgBlobGasPrice,
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
            overall
              ? {
                  value:
                    BigInt(overall.block.totalBlobAsCalldataFee) -
                    BigInt(overall.block.totalBlobFee),
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
            value: overall
              ? BigInt(overall.block.totalBlobAsCalldataGasUsed) -
                BigInt(overall.block.totalBlobGasUsed)
              : undefined,
            type: "ethereum",
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
            value: overall?.transaction.totalTransactions,
          }}
        />

        <MetricCard
          name="Total Unique Receivers"
          metric={{
            value: overall?.transaction.totalUniqueReceivers,
          }}
        />

        <MetricCard
          name="Total Unique Senders"
          metric={{
            value: overall?.transaction.totalUniqueSenders,
          }}
        />

        <MetricCard
          name="Avg. Max Blob Gas Fee"
          metric={{
            value: overall?.transaction.avgMaxBlobGasFee,
            type: "ethereum",
          }}
        />
      </div>
    </div>
  );
}

const TIME_FRAMES: { label: string; value: TimeFrame }[] = [
  { label: "1 year", value: "360d" },
  { label: "6 months", value: "180d" },
  { label: "1 month", value: "30d" },
  { label: "7 days", value: "7d" },
  { label: "1 day", value: "1d" },
];

const SECTIONS: { label: string; value: Section }[] = [
  { label: "All", value: "All" },
  { label: "Blob", value: "Blob" },
  { label: "Block", value: "Block" },
  { label: "Transaction", value: "Transaction" },
];

type Section = "All" | "Blob" | "Block" | "Transaction";

function Charts() {
  const [sectionFilter, setSectionFilter] = useState<Section>("All");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("30d");
  const { data: daily } = api.stats.getAllDailyStats.useQuery({ timeFrame });

  return (
    <>
      <div className="flex flex-wrap items-center justify-start gap-4">
        <Dropdown
          options={SECTIONS}
          selected={SECTIONS.find((option) => option.value === sectionFilter)}
          onChange={(option) => {
            if (!option) return;
            setSectionFilter(option.value as Section);
          }}
        />
        <Dropdown
          options={TIME_FRAMES}
          selected={TIME_FRAMES.find((option) => option.value === timeFrame)}
          onChange={(option) => {
            if (!option) return;
            setTimeFrame(option.value as TimeFrame);
          }}
        />
      </div>

      <ChartSection
        title="Blob Stats"
        hide={sectionFilter !== "All" && sectionFilter !== "Blob"}
      >
        <DailyBlobsChart
          days={daily?.blob.days}
          blobs={daily?.blob.totalBlobs}
          uniqueBlobs={daily?.blob.totalUniqueBlobs}
        />
        <DailyBlobSizeChart
          days={daily?.blob.days}
          blobSizes={daily?.blob.totalBlobSizes}
        />
      </ChartSection>

      <ChartSection
        title="Block Stats"
        hide={sectionFilter !== "All" && sectionFilter !== "Block"}
      >
        <DailyBlocksChart
          days={daily?.block.days}
          blocks={daily?.block.totalBlocks}
        />
        <DailyBlobGasUsedChart
          days={daily?.block.days}
          blobGasUsed={daily?.block.totalBlobGasUsed}
        />
        <DailyBlobGasComparisonChart
          days={daily?.block.days}
          blobGasUsed={daily?.block.totalBlobGasUsed}
          blobAsCalldataGasUsed={daily?.block.totalBlobAsCalldataGasUsed}
        />
        <DailyBlobFeeChart
          days={daily?.block.days}
          blobFees={daily?.block.totalBlobFees}
        />
        <DailyAvgBlobFeeChart
          days={daily?.block.days}
          avgBlobFees={daily?.block.avgBlobFees}
        />
        <DailyAvgBlobGasPriceChart
          days={daily?.block.days}
          avgBlobGasPrices={daily?.block.avgBlobGasPrices}
        />
      </ChartSection>

      <ChartSection
        title="Transaction Stats"
        hide={sectionFilter !== "All" && sectionFilter !== "Transaction"}
      >
        <DailyTransactionsChart
          days={daily?.transaction.days}
          transactions={daily?.transaction.totalTransactions}
        />
        <DailyUniqueAddressesChart
          days={daily?.transaction.days}
          uniqueReceivers={daily?.transaction.totalUniqueReceivers}
          uniqueSenders={daily?.transaction.totalUniqueSenders}
        />
        <DailyAvgMaxBlobGasFeeChart
          days={daily?.transaction.days}
          avgMaxBlobGasFees={daily?.transaction.avgMaxBlobGasFees}
        />
      </ChartSection>
    </>
  );
}

function ChartSection({
  children,
  title,
  hide,
}: {
  children: ReactNode;
  title: string;
  hide?: boolean;
}) {
  if (hide) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="text-lg font-medium">{title}</div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>div]:w-full">
        {children}
      </div>
    </div>
  );
}

export default Stats;
