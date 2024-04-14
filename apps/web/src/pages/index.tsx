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
import type { FullBlock } from "~/types";
import {
  buildBlobsRoute,
  buildBlocksRoute,
  buildTransactionsRoute,
  deserializeBlockOverallStats,
  deserializeFullBlock,
} from "~/utils";

const LATEST_ITEMS_LENGTH = 5;
const DAILY_STATS_TIMEFRAME = "15d";

const Home: NextPage = () => {
  const router = useRouter();
  const {
    data: rawBlocksData,
    error: latestBlocksError,
    isLoading: latestBlocksLoading,
  } = api.block.getAll.useQuery<{ blocks: FullBlock[]; totalBlocks: number }>({
    p: 1,
    ps: LATEST_ITEMS_LENGTH,
    expand: "transaction,blob",
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
  const { blocks, transactions, blobs } = useMemo(() => {
    if (!rawBlocksData) {
      return { blocks: [], transactions: [], blobs: [] };
    }

    const blocks = rawBlocksData.blocks.map(deserializeFullBlock);
    const transactions = blocks
      .flatMap((b) => b.transactions)
      .slice(0, LATEST_ITEMS_LENGTH);
    const blobs = transactions
      .flatMap((t) => t.blobs)
      .slice(0, LATEST_ITEMS_LENGTH);

    return {
      blocks,
      transactions,
      blobs,
    };
  }, [rawBlocksData]);
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
        <div className="grid grid-cols-1 items-stretch justify-stretch gap-6 lg:grid-cols-3">
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
            {latestBlocksLoading || !blocks || blocks.length ? (
              <div className="flex flex-col gap-5">
                {latestBlocksLoading
                  ? Array(LATEST_ITEMS_LENGTH)
                      .fill(0)
                      .map((_, i) => (
                        <div className="flex-grow" key={i}>
                          <BlockCard />
                        </div>
                      ))
                  : blocks.map((b) => (
                      <div className="h-28 flex-grow" key={b.hash}>
                        <BlockCard block={b} />
                      </div>
                    ))}
              </div>
            ) : undefined}
          </Card>
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
            {latestBlocksLoading || !transactions || transactions.length ? (
              <div className="flex flex-col gap-5">
                {latestBlocksLoading
                  ? Array(LATEST_ITEMS_LENGTH)
                      .fill(0)
                      .map((_, i) => <BlobTransactionCard key={i} />)
                  : transactions.map((tx) => {
                      return (
                        <div className="h-28" key={tx.hash}>
                          <BlobTransactionCard
                            transaction={{
                              from: tx.from,
                              to: tx.to,
                              hash: tx.hash,
                              rollup: tx.rollup,
                              blobGasBaseFee: tx.blobGasBaseFee,
                              blobGasMaxFee: tx.blobGasMaxFee,
                            }}
                            blobs={tx.blobs}
                            compact
                          />
                        </div>
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
            {latestBlocksLoading || !blobs || blobs.length ? (
              <div className="flex flex-col gap-5">
                {latestBlocksLoading
                  ? Array(LATEST_ITEMS_LENGTH)
                      .fill(0)
                      .map((_, i) => <BlobCard key={i} />)
                  : blobs.map((b) => (
                      <div key={b.versionedHash} className="h-28">
                        <BlobCard blob={b} />
                      </div>
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
