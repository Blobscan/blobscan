import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { Logo } from "~/components/BlobscanLogo";
import { Button } from "~/components/Button";
import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { DailyBlobGasComparisonChart } from "~/components/Charts/Block";
import { DailyTransactionsChart } from "~/components/Charts/Transaction";
import { Link } from "~/components/Link";
import { SearchInput } from "~/components/SearchInput";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type { FullTransaction } from "~/types";
import {
  buildBlobsRoute,
  buildBlocksRoute,
  buildTransactionsRoute,
  deserializeBlock,
  deserializeBlockOverallStats,
  deserializeFullTransaction,
} from "~/utils";

const LATEST_BLOCKS_LENGTH = 4;
const LATEST_TXS_LENGTH = 5;
const LATEST_BLOBS_LENGTH = 5;
const DAILY_STATS_TIMEFRAME = "15d";

const Home: NextPage = () => {
  const router = useRouter();
  const {
    data: rawBlocksData,
    error: latestBlocksError,
    isLoading: latestBlocksLoading,
  } = api.block.getAll.useQuery({
    p: 1,
    ps: LATEST_BLOCKS_LENGTH,
  });
  const {
    data: rawTxsData,
    isLoading: latestTxsLoading,
    error: latestTxsError,
  } = api.tx.getAll.useQuery<{
    totalTransactions: number;
    transactions: FullTransaction[];
  }>({
    p: 1,
    ps: LATEST_TXS_LENGTH,
    expand: "block,blob",
  });
  const {
    data: blobsData,
    isLoading: latestBlobsLoading,
    error: latestBlobsError,
  } = api.blob.getAll.useQuery({
    p: 1,
    ps: LATEST_BLOBS_LENGTH,
  });

  const { data: rawOverallStats, error: overallStatsErr } =
    api.stats.getAllOverallStats.useQuery();
  const { data: dailyTxStats, error: dailyTxStatsErr } =
    api.stats.getTransactionDailyStats.useQuery({
      timeFrame: DAILY_STATS_TIMEFRAME,
    });
  const { data: dailyBlockStats, error: dailyBlockStatsErr } =
    api.stats.getBlockDailyStats.useQuery({
      timeFrame: DAILY_STATS_TIMEFRAME,
    });
  const latestBlocks = useMemo(() => {
    if (!rawBlocksData) {
      return [];
    }

    return rawBlocksData.blocks.map(deserializeBlock);
  }, [rawBlocksData]);
  const latestTransactions = useMemo(() => {
    if (!rawTxsData) {
      return [];
    }

    return rawTxsData.transactions.map(deserializeFullTransaction);
  }, [rawTxsData]);
  const overallStats = useMemo(() => {
    if (!rawOverallStats) {
      return;
    }

    return {
      ...rawOverallStats,
      block: deserializeBlockOverallStats(rawOverallStats.block),
    };
  }, [rawOverallStats]);

  const error =
    latestBlocksError ||
    latestTxsError ||
    latestBlobsError ||
    overallStatsErr ||
    dailyTxStatsErr ||
    dailyBlockStatsErr;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  const latestBlobs = blobsData?.blobs ?? [];
  const totalBlobSize = overallStats?.blob?.totalBlobSize;

  return (
    <div className="flex flex-col items-center justify-center gap-12 sm:gap-20">
      <div className=" flex flex-col items-center justify-center gap-8 md:w-8/12">
        <Logo className="w-64 md:w-80" />
        <div className="flex w-full max-w-lg flex-col items-stretch justify-center space-y-2">
          <SearchInput />
          <span className="text- text-center text-sm  text-contentSecondary-light dark:text-contentSecondary-dark">
            Blob transaction explorer for the{" "}
            <Link href="https://www.eip4844.com/" isExternal>
              EIP-4844
            </Link>
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-8 sm:gap-16">
        <div className="grid grid-cols-2 space-y-6 lg:grid-cols-10 lg:gap-6 lg:space-y-0">
          <div className="col-span-2 sm:col-span-4">
            <DailyBlobGasComparisonChart
              days={dailyBlockStats?.days}
              blobAsCalldataGasUsed={
                dailyBlockStats?.totalBlobAsCalldataGasUsed
              }
              blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
              opts={{ toolbox: { show: false } }}
            />
          </div>
          <div className="col-span-2 grid w-full grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
            <div className="col-span-2">
              <MetricCard
                name="Total Tx Fees Saved"
                metric={{
                  value:
                    typeof overallStats?.block?.totalBlobAsCalldataFee !==
                      "undefined" &&
                    typeof overallStats?.block?.totalBlobFee !== "undefined"
                      ? overallStats.block.totalBlobAsCalldataFee -
                        overallStats.block.totalBlobFee
                      : undefined,
                  type: "ethereum",
                }}
                compact
              />
            </div>
            <MetricCard
              name="Total Blocks"
              metric={{
                value: overallStats?.block?.totalBlocks,
              }}
              compact
            />
            <MetricCard
              name="Total Txs"
              metric={{
                value: overallStats?.transaction?.totalTransactions,
              }}
              compact
            />
            <MetricCard
              name="Total Blobs"
              metric={{
                value: overallStats?.blob?.totalBlobs,
              }}
              compact
            />
            <MetricCard
              name="Total Blob Size"
              metric={{
                value: totalBlobSize ? BigInt(totalBlobSize) : undefined,
                type: "bytes",
              }}
              compact
            />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <DailyTransactionsChart
              days={dailyTxStats?.days}
              transactions={dailyTxStats?.totalTransactions}
              opts={{ toolbox: { show: false } }}
              compact
            />
          </div>
        </div>
        <Card
          header={
            <div className="flex items-center justify-between gap-5">
              <div>Latest Blocks</div>
              <Button
                variant="outline"
                label="View All Blocks"
                onClick={() => void router.push(buildBlocksRoute())}
              />
            </div>
          }
          emptyState="No blocks"
        >
          {latestBlocksLoading || !latestBlocks || latestBlocks.length ? (
            <div className="flex flex-col flex-wrap gap-5 lg:flex-row">
              {latestBlocksLoading
                ? Array(LATEST_BLOCKS_LENGTH)
                    .fill(0)
                    .map((_, i) => (
                      <div className="flex-grow" key={i}>
                        <BlockCard />
                      </div>
                    ))
                : latestBlocks.map((b) => (
                    <div className="flex-grow" key={b.hash}>
                      <BlockCard block={b} />
                    </div>
                  ))}
            </div>
          ) : undefined}
        </Card>
        <div className="grid grid-cols-1 items-stretch justify-stretch gap-6 lg:grid-cols-2">
          <Card
            header={
              <div className="flex items-center justify-between gap-5">
                <div>Latest Blob Transactions</div>
                <Button
                  variant="outline"
                  label="View All Txs"
                  onClick={() => void router.push(buildTransactionsRoute())}
                  className="h-full"
                />
              </div>
            }
            emptyState="No transactions"
          >
            {latestTxsLoading ||
            !latestTransactions ||
            latestTransactions.length ? (
              <div className="flex flex-col gap-5">
                {latestTxsLoading
                  ? Array(LATEST_TXS_LENGTH)
                      .fill(0)
                      .map((_, i) => <BlobTransactionCard key={i} />)
                  : latestTransactions.map((latestTx) => {
                      const { block, ...tx } = latestTx;

                      return (
                        <BlobTransactionCard
                          key={latestTx.hash}
                          transaction={tx}
                          block={block}
                          blobs={latestTx.blobs}
                        />
                      );
                    })}
              </div>
            ) : undefined}
          </Card>
          <Card
            header={
              <div className="flex items-center justify-between gap-5">
                <div>Latest Blobs</div>
                <Button
                  variant="outline"
                  label="View All Blobs"
                  onClick={() => void router.push(buildBlobsRoute())}
                />
              </div>
            }
            emptyState="No blobs"
          >
            {latestBlobsLoading || !latestBlobs || latestBlobs.length ? (
              <div className="flex flex-col gap-5">
                {latestBlobsLoading
                  ? Array(LATEST_BLOBS_LENGTH)
                      .fill(0)
                      .map((_, i) => <BlobCard key={i} />)
                  : latestBlobs.map((b) => (
                      <BlobCard key={b.versionedHash} blob={b} />
                    ))}
              </div>
            ) : undefined}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
