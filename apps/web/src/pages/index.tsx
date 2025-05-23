import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/router";

import { BlobscanLogo } from "~/components/BlobscanLogo";
import { Button } from "~/components/Button";
import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { DailyBlobsChart } from "~/components/Charts/Blob";
import { DailyAvgBlobGasPriceChart } from "~/components/Charts/Block";
import { convertStatsToChartSeries } from "~/components/Charts/helpers";
import { Link } from "~/components/Link";
import { SearchInput } from "~/components/SearchInput";
import { SlidableList } from "~/components/SlidableList";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import type {
  BlockWithExpandedBlobsAndTransactions,
  DailyStats,
  MakeRequired,
} from "~/types";
import {
  buildBlobsRoute,
  buildBlocksRoute,
  buildTransactionsRoute,
} from "~/utils";

const LATEST_ITEMS_LENGTH = 5;

const CARD_HEIGHT = "sm:h-28";

const Home: NextPage = () => {
  const router = useRouter();
  const {
    data: blocksData,
    error: latestBlocksError,
    isLoading: latestBlocksLoading,
  } = api.block.getAll.useQuery<{
    blocks: BlockWithExpandedBlobsAndTransactions[];
  }>({
    p: 1,
    ps: LATEST_ITEMS_LENGTH,
    expand: "transaction,blob",
  });
  const { data: overallStats, error: overallStatsErr } =
    api.stats.getOverallStats.useQuery(undefined, {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: (data) => data[0],
    });
  const { data: dailyStatsData, error: dailyStatsErr } =
    api.stats.getDailyStats.useQuery(
      {
        stats: "totalBlobs,avgBlobGasPrice",
        timeFrame: "15d",
        categories: "all",
        rollups: "all",
        sort: "asc",
      },
      {
        refetchOnWindowFocus: false,
      }
    );

  const dailyStats = useMemo(() => {
    if (!dailyStatsData) {
      return;
    }
    return convertStatsToChartSeries(
      dailyStatsData as MakeRequired<
        DailyStats,
        "totalBlobs" | "avgBlobGasPrice"
      >[]
    );
  }, [dailyStatsData]);
  const { days, series, totalSeries } = dailyStats || {};

  const { blocks, transactions, blobs } = useMemo(() => {
    if (!blocksData) {
      return { blocks: [], transactions: [], blobs: [] };
    }

    const blocks = blocksData.blocks;
    const transactions = blocks
      .flatMap((b) =>
        b.transactions.map((tx) => ({
          ...tx,
          blockTimestamp: b.timestamp,
        }))
      )
      .slice(0, LATEST_ITEMS_LENGTH);
    const blobs = transactions
      .flatMap((tx) => tx.blobs.map((b) => ({ ...b, rollup: tx.rollup })))
      .slice(0, LATEST_ITEMS_LENGTH);

    return {
      blocks,
      transactions,
      blobs,
    };
  }, [blocksData]);

  const error = latestBlocksError || overallStatsErr || dailyStatsErr;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-12 sm:gap-20">
      <div className=" flex flex-col items-center justify-center gap-8 md:w-8/12">
        <BlobscanLogo className="w-64 md:w-80" />
        <div className="flex w-full max-w-lg flex-col items-stretch justify-center space-y-2">
          <SearchInput />
          <span className="text-center text-sm  text-contentSecondary-light dark:text-contentSecondary-dark">
            Blob transaction explorer for the{" "}
            <Link href="https://www.eip4844.com/" isExternal>
              EIP-4844
            </Link>
          </span>
        </div>
      </div>
      <div className="flex w-full flex-col gap-8 sm:gap-10">
        <div className="grid grid-cols-2 space-y-6 lg:grid-cols-10 lg:gap-6 lg:space-y-0">
          <div className="col-span-2 sm:col-span-4">
            <DailyAvgBlobGasPriceChart
              days={days}
              series={totalSeries?.avgBlobGasPrice}
              size="sm"
              compact
            />
          </div>
          <div className="col-span-2 grid w-full grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
            <div className="col-span-2">
              <MetricCard
                name="Total Tx Fees Saved"
                metric={{
                  value: overallStats
                    ? overallStats.totalBlobAsCalldataFee -
                      overallStats.totalBlobFee
                    : undefined,
                  type: "ethereum",
                }}
                compact
              />
            </div>
            <MetricCard
              name="Total Blocks"
              metric={{
                value: overallStats?.totalBlocks,
              }}
              compact
            />
            <MetricCard
              name="Total Txs"
              metric={{
                value: overallStats?.totalTransactions,
              }}
              compact
            />
            <MetricCard
              name="Total Blobs"
              metric={{
                value: overallStats?.totalBlobs,
              }}
              compact
            />
            <MetricCard
              name="Total Blob Size"
              metric={{
                value: overallStats?.totalBlobSize,
                type: "bytes",
              }}
              compact
            />
          </div>
          <div className="col-span-2 sm:col-span-4">
            <DailyBlobsChart
              size="sm"
              days={days}
              series={series?.totalBlobs}
              compact
            />
          </div>
        </div>
        <div className="grid grid-cols-1 items-stretch justify-stretch gap-6 lg:grid-cols-3">
          <Card
            header={
              <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                <div>Latest Blocks</div>
                <Button
                  variant="outline"
                  onClick={() => void router.push(buildBlocksRoute())}
                >
                  View All Blocks
                </Button>
              </div>
            }
            emptyState="No blocks"
          >
            {latestBlocksLoading ? (
              <div className="flex flex-col gap-4">
                {Array(LATEST_ITEMS_LENGTH)
                  .fill(0)
                  .map((_, i) => (
                    <BlockCard className={CARD_HEIGHT} key={i} />
                  ))}
              </div>
            ) : (
              <SlidableList
                items={blocks?.map((b) => ({
                  id: b.hash,
                  element: (
                    <BlockCard className={CARD_HEIGHT} block={b} key={b.hash} />
                  ),
                }))}
              />
            )}
          </Card>
          <Card
            header={
              <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                <div>Latest Blob Transactions</div>
                <Button
                  variant="outline"
                  onClick={() => void router.push(buildTransactionsRoute())}
                  className="h-full"
                >
                  View All Txs
                </Button>
              </div>
            }
            emptyState="No transactions"
          >
            {latestBlocksLoading ? (
              <div className="flex flex-col gap-3">
                {Array(LATEST_ITEMS_LENGTH)
                  .fill(0)
                  .map((_, i) => (
                    <BlobTransactionCard
                      className={CARD_HEIGHT}
                      compact
                      key={i}
                    />
                  ))}
              </div>
            ) : (
              <SlidableList
                items={transactions.map((tx) => ({
                  id: tx.hash,
                  element: (
                    <BlobTransactionCard
                      className={CARD_HEIGHT}
                      key={tx.hash}
                      transaction={{
                        from: tx.from,
                        to: tx.to,
                        hash: tx.hash,
                        rollup: tx.rollup,
                        blockTimestamp: tx.blockTimestamp,
                        blobGasBaseFee: tx.blobGasBaseFee,
                        blobGasMaxFee: tx.blobGasMaxFee,
                      }}
                      blobs={tx.blobs}
                      compact
                    />
                  ),
                }))}
              />
            )}
          </Card>
          <Card
            header={
              <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                <div>Latest Blobs</div>
                <Button
                  variant="outline"
                  onClick={() => void router.push(buildBlobsRoute())}
                >
                  View All Blobs
                </Button>
              </div>
            }
            emptyState="No blobs"
          >
            {latestBlocksLoading ? (
              <div className="flex flex-col gap-3">
                {Array(LATEST_ITEMS_LENGTH)
                  .fill(0)
                  .map((_, i) => (
                    <BlobTransactionCard
                      className={CARD_HEIGHT}
                      compact
                      key={i}
                    />
                  ))}
              </div>
            ) : (
              <SlidableList
                items={blobs.map((b) => ({
                  id: b.versionedHash,
                  element: (
                    <BlobCard
                      blob={b}
                      compact
                      key={b.versionedHash}
                      className={CARD_HEIGHT}
                    />
                  ),
                }))}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
