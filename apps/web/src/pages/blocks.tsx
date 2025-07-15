import { useMemo, useState } from "react";
import type { NextPage } from "next";

import { formatWei } from "@blobscan/eth-format";
import { getNetworkBlobConfigBySlot } from "@blobscan/network-blob-config";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { BlobGasUsageDisplay } from "~/components/Displays/BlobGasUsageDisplay";
import { Filters } from "~/components/Filters";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { Skeleton } from "~/components/Skeleton";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/TimestampToggle";
import { TimestampToggle } from "~/components/TimestampToggle";
import { api } from "~/api-client";
import { useQueryParams } from "~/hooks/useQueryParams";
import NextError from "~/pages/_error";
import { useEnv } from "~/providers/Env";
import type { BlockWithExpandedTransactions } from "~/types";
import {
  buildBlobRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatNumber,
  normalizeTimestamp,
} from "~/utils";

const Blocks: NextPage = function () {
  const { env } = useEnv();
  const { paginationParams, filterParams } = useQueryParams();
  const rollups = filterParams?.rollups?.join(",");

  const {
    data: blocksData,
    isLoading: blocksIsLoading,
    error: blocksError,
  } = api.block.getAll.useQuery<{ blocks: BlockWithExpandedTransactions[] }>({
    ...paginationParams,
    ...filterParams,
    rollups,
    expand: "transaction",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.block.getCount.useQuery(
    {
      ...filterParams,
      rollups,
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const { blocks } = blocksData || {};
  const { totalBlocks } = countData || {};
  const error = blocksError || countError;
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
  const blockHeaders = [
    {
      cells: [
        {
          item: "",
          className: "w-[100px]",
        },
        {
          item: "Block number",
          className: "2xl:w-[187px] lg:w-[158px] w-[118px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
          className: "2xl:w-[237px] lg:w-[200px] w-[170px]",
        },
        {
          item: "Slot",
          className: "2xl:w-[136px] lg:w-[115px] w-[96px]",
        },
        {
          item: "Txs",
          className: "2xl:w-[77px] w-[66px]",
        },
        {
          item: "Blobs",
          className: "2xl:w-[98px] w-[83px]",
        },
        {
          item: "Blob Gas Price",
          className: "2xl:w-[195px] w-[165px]",
        },
        {
          item: "Blob Gas Used",
          className: "2xl:w-full w-[240px]",
        },
      ],
    },
  ];

  const blocksRows = useMemo(() => {
    if (!blocks || !env) {
      return;
    }

    return blocks.map(
      ({
        blobGasPrice,
        blobGasUsed,
        number,
        slot,
        timestamp,
        transactions,
      }) => {
        const formattedTimestamp = normalizeTimestamp(timestamp);
        const blobCount = transactions?.reduce(
          (acc, tx) => acc + tx.blobs.length,
          0
        );
        const txsBlobs = transactions.flatMap((tx) =>
          tx.blobs.map(({ dataStorageReferences, versionedHash }) => ({
            transactionHash: tx.hash,
            blobVersionedHash: versionedHash,
            category: tx.category,
            rollup: tx.rollup,
            dataStorageReferences,
          }))
        );

        return {
          cells: [
            {
              item: (
                <div className="relative flex">
                  {[...new Set(transactions.map((tx) => tx.rollup))].map(
                    (rollup, i) => {
                      return rollup ? (
                        <div key={i} className="-ml-1 first-of-type:ml-0">
                          <RollupBadge rollup={rollup} compact />
                        </div>
                      ) : (
                        <></>
                      );
                    }
                  )}
                </div>
              ),
            },
            {
              item: (
                <Copyable
                  value={number.toString()}
                  tooltipText="Copy block number"
                >
                  <Link href={buildBlockRoute(number)}>{number}</Link>
                </Copyable>
              ),
            },
            {
              item:
                timeFormat === "relative"
                  ? formattedTimestamp.fromNow()
                  : formattedTimestamp.format("YYYY-MM-DD HH:mm:ss"),
            },
            {
              item: (
                <Link
                  href={`${env?.PUBLIC_BEACON_BASE_URL}/slot/${slot}`}
                  isExternal
                >
                  {slot}
                </Link>
              ),
            },
            {
              item: (
                <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  {transactions.length}
                </span>
              ),
            },
            {
              item: (
                <span className="text-contentSecondary-light dark:text-contentSecondary-dark">
                  {blobCount}
                </span>
              ),
            },
            {
              item: formatWei(blobGasPrice, { toUnit: "Gwei" }),
            },
            {
              item: (
                <BlobGasUsageDisplay
                  networkBlobConfig={getNetworkBlobConfigBySlot(
                    env.PUBLIC_NETWORK_NAME,
                    slot
                  )}
                  blobGasUsed={blobGasUsed}
                  compact
                />
              ),
            },
          ],
          expandItem: (
            <Table
              className="mb-4 mt-2 max-h-[420px] rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
              size="xs"
              alignment="left"
              headers={[
                {
                  cells: [
                    { item: "" },
                    {
                      item: "Tx Hash",
                    },
                    {
                      item: "Blob Versioned Hash",
                    },
                    {
                      item: "Blob Storages",
                    },
                  ],
                  className: "dark:border-border-dark/20",
                  sticky: true,
                },
              ]}
              rows={txsBlobs.map(
                ({
                  transactionHash,
                  blobVersionedHash,
                  rollup,
                  category,
                  dataStorageReferences,
                }) => ({
                  cells: [
                    {
                      item:
                        category === "rollup" && rollup ? (
                          <RollupBadge rollup={rollup} compact />
                        ) : (
                          <></>
                        ),
                    },
                    {
                      item: (
                        <Copyable
                          value={transactionHash}
                          tooltipText="Copy transaction hash"
                        >
                          <Link href={buildTransactionRoute(transactionHash)}>
                            {transactionHash}
                          </Link>
                        </Copyable>
                      ),
                    },
                    {
                      item: (
                        <Copyable
                          value={blobVersionedHash}
                          tooltipText="Copy blob versioned hash"
                        >
                          <Link href={buildBlobRoute(blobVersionedHash)}>
                            {blobVersionedHash}
                          </Link>
                        </Copyable>
                      ),
                    },
                    {
                      item: dataStorageReferences && (
                        <div className="flex items-center gap-2">
                          {dataStorageReferences.map(({ storage, url }) => (
                            <StorageBadge
                              key={storage}
                              storage={storage}
                              url={url}
                              compact
                            />
                          ))}
                        </div>
                      ),
                    },
                  ],
                })
              )}
            />
          ),
        };
      }
    );
  }, [blocks, timeFormat, env]);

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <div>Blocks</div>
          <div>
            {!countIsLoading && totalBlocks !== undefined ? (
              `(${formatNumber(totalBlocks)})`
            ) : (
              <div className="relative left-0 top-1">
                <Skeleton width={100} height={25} />
              </div>
            )}
          </div>
        </div>
      </Header>
      <Filters />
      <PaginatedTable
        isLoading={blocksIsLoading}
        headers={blockHeaders}
        rows={blocksRows}
        totalItems={totalBlocks}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
        isExpandable
      />
    </>
  );
};

export default Blocks;
