import { useMemo } from "react";
import type { NextPage } from "next";
import { useRouter } from "next/compat/router";

import { BlobscanLogo } from "~/components/BlobscanLogo";
import { Button } from "~/components/Button";
import type { CardProps } from "~/components/Cards/Card";
import { Card } from "~/components/Cards/Card";
import { MetricCard } from "~/components/Cards/MetricCard";
import type { MetricCardProps } from "~/components/Cards/MetricCard";
import { BlobCard } from "~/components/Cards/SurfaceCards/BlobCard";
import { BlobTransactionCard } from "~/components/Cards/SurfaceCards/BlobTransactionCard";
import { BlockCard } from "~/components/Cards/SurfaceCards/BlockCard";
import { TimeseriesChartBase } from "~/components/Charts/TimeseriesChartBase";
import { EmptyState } from "~/components/EmptyState";
import { Link } from "~/components/Link";
import { SearchInput } from "~/components/SearchInput";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { SlidableList } from "~/components/SlidableList";
import { GLOBAL_MAIN_SERIES_COLOR } from "~/components/TimeseriesCharts/colors";
import { api } from "~/api-client";
import { toAggregatedMetrics } from "~/hooks/useAggregateOverallStats";
import { useTimeseriesQuery } from "~/hooks/useTimeseriesQuery";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { BlockWithExpandedBlobsAndTransactions, Pagination } from "~/types";

const LATEST_ITEMS_LENGTH = 5;

const CARD_HEIGHT = "sm:h-28";
const COUNT_FORMAT: Intl.NumberFormatOptions = {
  notation: "standard",
  maximumFractionDigits: 0,
};

function HomepageCard({ children, ...restProps }: CardProps) {
  return (
    <Card {...restProps} className="h-[790px] sm:h-[750px]">
      {children}
    </Card>
  );
}

const Home: NextPage = () => {
  const router = useRouter();
  const {
    data: blocksData,
    error: latestBlocksError,
    isLoading: latestBlocksLoading,
  } = api.block.getAllByCursor.useQuery<{
    blocks: BlockWithExpandedBlobsAndTransactions[];
    pagination: Pagination;
  }>({
    ps: LATEST_ITEMS_LENGTH,
    expand: "transaction,blob",
  });
  const { data: globalOverallStats, error: overallStatsErr } =
    api.stats.getOverall.useQuery(undefined, {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      select: ({ data }) => {
        const globalMetrics = data.find(
          ({ dimension }) => dimension.type === "global"
        )?.metrics;

        return globalMetrics ? toAggregatedMetrics(globalMetrics) : undefined;
      },
    });
  const {
    data: globalChartDataset,
    isLoading: globalChartLoading,
    error: globalChartDataError,
  } = useTimeseriesQuery({
    metrics: ["avgBlobGasPrice", "totalBlobs"],
    timeFrame: "30d",
    granularity: "day",
  });
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
      .flatMap((tx) =>
        // The blobs have the order of their index in the transaction.
        tx.blobs.map((b, index) => ({
          ...b,
          rollup: tx.rollup,
          position: { txHash: tx.hash, index },
        }))
      )
      .slice(0, LATEST_ITEMS_LENGTH);

    return {
      blocks,
      transactions,
      blobs,
    };
  }, [blocksData]);
  const isEmpty = !latestBlocksLoading && blocks.length === 0;
  const error = latestBlocksError || overallStatsErr || globalChartDataError;
  const metrics: MetricCardProps[] = [
    {
      name: "Total Blobs",
      metric: {
        primary: {
          value: globalOverallStats?.totalBlobs,
          numberFormatOpts: COUNT_FORMAT,
        },
      },
    },
    {
      name: "Blob Transactions",
      metric: {
        primary: {
          value: globalOverallStats?.totalTransactions,
          numberFormatOpts: COUNT_FORMAT,
        },
      },
    },
    {
      name: "Blob Data Used",
      metric: {
        primary: {
          value: globalOverallStats?.totalBlobUsageSize,
          type: "bytes",
        },
      },
    },
    {
      name: "Blob Fees Burned",
      metric: {
        primary: {
          value: globalOverallStats?.totalBlobBaseFee,
          type: "ethereum",
          numberFormatOpts: {
            notation: "standard",
            maximumFractionDigits: 9,
          },
        },
      },
    },
  ];

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <SeoMetaTags />
      <div className="flex flex-col items-center justify-center gap-12 sm:gap-20">
        <div className=" flex flex-col items-center justify-center gap-8 md:w-[650px]">
          <BlobscanLogo className="w-64 md:w-80" />
          <div className="flex w-full  flex-col items-stretch justify-center space-y-2">
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
          <div className="flex flex-col gap-6">
            <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2">
              <TimeseriesChartBase
                title="Daily Blobs"
                yAxis={{ type: "count" }}
                timeseries={[
                  {
                    name: "Blobs",
                    type: "bar",
                    metric: "totalBlobs",
                    color: GLOBAL_MAIN_SERIES_COLOR,
                  },
                ]}
                dataset={globalChartDataset}
                isLoading={globalChartLoading}
                headerControls={
                  <span className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
                    Last 30 days
                  </span>
                }
                size="sm"
                compact
                minimal
              />
              <TimeseriesChartBase
                title="Avg. Blob Gas Price"
                yAxis={{
                  type: "average",
                  unitType: "ether",
                  unit: "wei",
                  displayUnit: "Gwei",
                }}
                timeseries={[
                  {
                    name: "Avg. Blob Gas Price",
                    type: "line",
                    metric: "avgBlobGasPrice",
                    color: GLOBAL_MAIN_SERIES_COLOR,
                    showArea: false,
                    lineStyle: { width: 2 },
                  },
                ]}
                size="sm"
                dataset={globalChartDataset}
                isLoading={globalChartLoading}
                headerControls={
                  <span className="text-xs text-contentSecondary-light dark:text-contentSecondary-dark">
                    Last 30 days
                  </span>
                }
                skeletonOpts={{ chart: { variant: "line" } }}
                compact
                minimal
              />
            </div>
            <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {metrics.map((metric) => (
                <MetricCard key={metric.name} {...metric} />
              ))}
            </div>
          </div>
        <div className="grid grid-cols-1 items-stretch justify-stretch gap-6 lg:grid-cols-3">
          <HomepageCard
            header={
              !isEmpty ? (
                <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                  <div>Latest Blocks</div>
                  <Button
                    variant="outline"
                    onClick={() => void router?.push(routes.blocks)}
                  >
                    View Blocks
                  </Button>
                </div>
              ) : null
            }
          >
            {latestBlocksLoading ? (
              <div className="flex flex-col gap-4">
                {Array(LATEST_ITEMS_LENGTH)
                  .fill(0)
                  .map((_, i) => (
                    <BlockCard className={CARD_HEIGHT} key={i} />
                  ))}
              </div>
            ) : !isEmpty ? (
              <SlidableList
                items={blocks?.map((b) => ({
                  id: b.hash,
                  element: (
                    <BlockCard className={CARD_HEIGHT} block={b} key={b.hash} />
                  ),
                }))}
              />
            ) : (
              <EmptyState size="sm" description="No blocks" />
            )}
          </HomepageCard>
          <HomepageCard
            header={
              !isEmpty ? (
                <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                  <div>Latest Blob Transactions</div>
                  <Button
                    variant="outline"
                    onClick={() => void router?.push(routes.txs)}
                    className="h-full"
                  >
                    View Txs
                  </Button>
                </div>
              ) : null
            }
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
            ) : !isEmpty ? (
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
            ) : (
              <EmptyState size="sm" description="No transactions" />
            )}
          </HomepageCard>
          <HomepageCard
            header={
              !isEmpty ? (
                <div className="flex flex-col flex-wrap justify-between gap-3 2xl:flex-row 2xl:items-center">
                  <div>Latest Blobs</div>
                  <Button
                    variant="outline"
                    onClick={() => void router?.push(routes.blobs)}
                  >
                    View Blobs
                  </Button>
                </div>
              ) : null
            }
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
            ) : !isEmpty ? (
              <SlidableList
                items={blobs.map((b) => ({
                  id: `${b.position.txHash}-${b.position.index}`,
                  element: (
                    <BlobCard
                      blob={b}
                      position={b.position}
                      compact
                      key={`${b.position.txHash}-${b.position.index}`}
                      className={CARD_HEIGHT}
                    />
                  ),
                }))}
              />
            ) : (
              <EmptyState size="sm" description="No blobs" />
            )}
          </HomepageCard>
        </div>
      </div>
    </div>
    </>
  );
};

export default Home;
