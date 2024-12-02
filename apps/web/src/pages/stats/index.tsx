import type { ReactNode } from "react";
import { useMemo, useState } from "react";

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
import type { Option } from "~/components/Dropdown";
import { Dropdown } from "~/components/Dropdown";
import { Header } from "~/components/Header";
import { api } from "~/api-client";
import type { DailyStats } from "~/types";
import { deserializeOverallStats } from "~/utils";

type ArrayfiedDailyStats = {
  days: DailyStats["day"][];
  totalBlocks: DailyStats["totalBlocks"][];
  totalBlobGasUsed: DailyStats["totalBlobGasUsed"][];
  totalBlobAsCalldataGasUsed: DailyStats["totalBlobAsCalldataGasUsed"][];
  totalBlobFees: DailyStats["totalBlobFee"][];
  totalBlobAsCalldataFees: DailyStats["totalBlobAsCalldataFee"][];
  avgBlobFees: DailyStats["avgBlobFee"][];
  avgBlobAsCalldataFees: DailyStats["avgBlobAsCalldataFee"][];
  avgBlobGasPrices: DailyStats["avgBlobGasPrice"][];
  totalTransactions: DailyStats["totalTransactions"][];
  totalUniqueSenders: DailyStats["totalUniqueSenders"][];
  totalUniqueReceivers: DailyStats["totalUniqueReceivers"][];
  avgMaxBlobGasFees: DailyStats["avgMaxBlobGasFee"][];
  totalBlobs: DailyStats["totalBlobs"][];
  totalUniqueBlobs: DailyStats["totalUniqueBlobs"][];
  totalBlobSizes: DailyStats["totalBlobSize"][];
};

const Stats = function () {
  return (
    <div className="flex flex-col gap-8">
      <OverallStats />
      <Charts />
    </div>
  );
};

function OverallStats() {
  const { data: rawOverallStats } = api.stats.getOverallStats.useQuery();
  const overallStats = useMemo(
    () =>
      rawOverallStats ? deserializeOverallStats(rawOverallStats) : undefined,
    [rawOverallStats]
  );

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

const TIME_FRAMES: { label: string; value: TimeFrame }[] = [
  { label: "1 year", value: "360d" },
  { label: "6 months", value: "180d" },
  { label: "1 month", value: "30d" },
  { label: "7 days", value: "7d" },
  { label: "1 day", value: "1d" },
];

const SECTIONS: { label: string; value: Section }[] = [
  { label: "All", value: "All" },
  { label: "Blobs", value: "Blob" },
  { label: "Blocks", value: "Block" },
  { label: "Transactions", value: "Transaction" },
];

type Section = "All" | "Blob" | "Block" | "Transaction";

function Charts() {
  const [sectionFilter, setSectionFilter] = useState<Section>("All");
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("180d");
  const { data: dailyStatsData } = api.stats.getDailyStats.useQuery({
    timeFrame,
  });
  const dailyStats = useMemo(
    () =>
      dailyStatsData
        ? dailyStatsData.reduce<ArrayfiedDailyStats>(
            (stats, currStats) => {
              stats.days.push(currStats.day);
              stats.totalBlocks.push(currStats.totalBlocks);
              stats.totalBlobGasUsed.push(currStats.totalBlobGasUsed);
              stats.totalBlobAsCalldataGasUsed.push(
                currStats.totalBlobAsCalldataGasUsed
              );
              stats.totalBlobFees.push(currStats.totalBlobFee);
              stats.totalBlobAsCalldataFees.push(
                currStats.totalBlobAsCalldataFee
              );
              stats.avgBlobFees.push(currStats.avgBlobFee);
              stats.avgBlobAsCalldataFees.push(currStats.avgBlobAsCalldataFee);
              stats.avgBlobGasPrices.push(currStats.avgBlobGasPrice);
              stats.totalTransactions.push(currStats.totalTransactions);
              stats.totalUniqueSenders.push(currStats.totalUniqueSenders);
              stats.totalUniqueReceivers.push(currStats.totalUniqueReceivers);
              stats.avgMaxBlobGasFees.push(currStats.avgMaxBlobGasFee);
              stats.totalBlobs.push(currStats.totalBlobs);
              stats.totalUniqueBlobs.push(currStats.totalUniqueBlobs);
              stats.totalBlobSizes.push(currStats.totalBlobSize);

              return stats;
            },
            {
              days: [],
              totalBlocks: [],
              totalBlobGasUsed: [],
              totalBlobAsCalldataGasUsed: [],
              totalBlobFees: [],
              totalBlobAsCalldataFees: [],
              avgBlobFees: [],
              avgBlobAsCalldataFees: [],
              avgBlobGasPrices: [],
              totalTransactions: [],
              totalUniqueSenders: [],
              totalUniqueReceivers: [],
              avgMaxBlobGasFees: [],
              totalBlobs: [],
              totalUniqueBlobs: [],
              totalBlobSizes: [],
            }
          )
        : undefined,
    [dailyStatsData]
  );

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <div className="flex flex-wrap items-center justify-start gap-4">
          <Dropdown
            width="w-48"
            options={SECTIONS}
            selected={SECTIONS.find((option) => option.value === sectionFilter)}
            onChange={(option: Option) => {
              if (!option) return;
              setSectionFilter(option.value as Section);
            }}
          />
          <Dropdown
            options={TIME_FRAMES}
            selected={TIME_FRAMES.find((option) => option.value === timeFrame)}
            onChange={(option: Option) => {
              if (!option) return;
              setTimeFrame(option.value as TimeFrame);
            }}
          />
        </div>
      </Card>

      <ChartSection
        title="Blobs"
        hide={sectionFilter !== "All" && sectionFilter !== "Blob"}
      >
        <DailyBlobsChart
          days={dailyStats?.days}
          blobs={dailyStats?.totalBlobs}
          uniqueBlobs={dailyStats?.totalUniqueBlobs}
        />
        <DailyBlobSizeChart
          days={dailyStats?.days}
          blobSizes={dailyStats?.totalBlobSizes}
        />
      </ChartSection>

      <ChartSection
        title="Blocks"
        hide={sectionFilter !== "All" && sectionFilter !== "Block"}
      >
        <DailyBlocksChart
          days={dailyStats?.days}
          blocks={dailyStats?.totalBlocks}
        />
        <DailyBlobGasUsedChart
          days={dailyStats?.days}
          blobGasUsed={dailyStats?.totalBlobGasUsed}
        />
        <DailyBlobGasComparisonChart
          days={dailyStats?.days}
          blobGasUsed={dailyStats?.totalBlobGasUsed}
          blobAsCalldataGasUsed={dailyStats?.totalBlobAsCalldataGasUsed}
        />
        <DailyBlobFeeChart
          days={dailyStats?.days}
          blobFees={dailyStats?.totalBlobFees}
        />
        <DailyAvgBlobFeeChart
          days={dailyStats?.days}
          avgBlobFees={dailyStats?.avgBlobFees}
        />
        <DailyAvgBlobGasPriceChart
          days={dailyStats?.days}
          avgBlobGasPrices={dailyStats?.avgBlobGasPrices}
        />
      </ChartSection>

      <ChartSection
        title="Transactions"
        hide={sectionFilter !== "All" && sectionFilter !== "Transaction"}
      >
        <DailyTransactionsChart
          days={dailyStats?.days}
          transactions={dailyStats?.totalTransactions}
        />
        <DailyUniqueAddressesChart
          days={dailyStats?.days}
          uniqueReceivers={dailyStats?.totalUniqueReceivers}
          uniqueSenders={dailyStats?.totalUniqueSenders}
        />
        <DailyAvgMaxBlobGasFeeChart
          days={dailyStats?.days}
          avgMaxBlobGasFees={dailyStats?.avgMaxBlobGasFees}
        />
      </ChartSection>
    </div>
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
      <Header>{title}</Header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>div]:w-full">
        {children}
      </div>
    </div>
  );
}

export default Stats;
