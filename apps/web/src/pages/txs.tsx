import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";
import { formatWei } from "@blobscan/eth-format";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { FiltersBar } from "~/components/FiltersBar";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { Skeleton } from "~/components/Skeleton";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/Toggles";
import { TimestampToggle } from "~/components/Toggles";
import { api } from "~/api-client";
import {
  serializedMultiValueParam,
  useQueryParams,
} from "~/hooks/useQueryParams";
import ErrorPage from "~/pages/_error";
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import type { ByteUnit } from "~/utils";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenHash,
  buildBlobRoute,
  calculatePercentage,
} from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";

const Txs: NextPage = function () {
  const { paginationParams, filterParams } = useQueryParams();
  const rollups = filterParams.rollups
    ? serializedMultiValueParam(filterParams.rollups)
    : undefined;
  const categories = filterParams.categories
    ? serializedMultiValueParam(filterParams.categories)
    : undefined;
  const {
    data: txsData,
    isLoading: txsIsLoading,
    error: txsError,
  } = api.tx.getAll.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    totalTransactions?: number;
  }>({
    ...paginationParams,
    ...filterParams,
    categories,
    rollups,
    expand: "block,blob",
  });
  const {
    data: countData,
    error: countError,
    isLoading: countIsLoading,
  } = api.tx.getCount.useQuery(
    {
      ...filterParams,
      categories,
      rollups,
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const { transactions } = txsData || {};
  const { totalTransactions } = countData || {};
  const error = txsError ?? countError;
  const [timeFormat, setTimeFormat] = useState<TimestampFormat>("relative");
  const transactionHeaders = [
    {
      cells: [
        { item: "", className: "w-[40px]" },
        {
          item: "Hash",
          className: "w-[150px]",
        },
        {
          item: "Block number",
          className: "w-[127px]",
        },
        {
          item: (
            <TimestampToggle format={timeFormat} onChange={setTimeFormat} />
          ),
          className: timeFormat === "relative" ? "w-[130px]" : "w-[175px]",
        },
        { item: "Blobs", className: "w-[62px]" },
        {
          item: `Blob Usage (${BYTES_UNIT})`,
          className: "w-[148px]",
        },
        {
          item: "From",
          className: "w-[150px]",
        },
        {
          item: "To",
          className: "w-[148px]",
        },

        {
          item: "Blob Base Fee (Gwei)",
          className: "w-[120px]",
        },
        {
          item: "Blob Max Fee (Gwei)",
          className: "w-[120px]",
        },
        {
          item: "Blob Gas Price (Gwei)",
          className: "sm:w-full w-[140px]",
        },
      ],
    },
  ];
  const transactionRows = useMemo(() => {
    return transactions
      ? transactions.map(
          ({
            hash,
            from,
            to,
            blobs,
            rollup,
            category,
            blockNumber,
            blobGasBaseFee,
            blobGasMaxFee,
            block,
            blockTimestamp,
          }) => {
            const totalBlobSize = blobs.reduce(
              (acc, { size }) => acc + size,
              0
            );
            const totalBlobUsage = blobs.reduce(
              (acc, { usageSize }) => acc + usageSize,
              0
            );
            return {
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
                    <Copyable value={hash} tooltipText="Copy hash">
                      <Link href={buildTransactionRoute(hash)}>
                        {shortenHash(hash)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Link href={buildBlockRoute(blockNumber)}>
                      {blockNumber}
                    </Link>
                  ),
                },
                {
                  item:
                    timeFormat === "relative"
                      ? formatTimestamp(blockTimestamp, true)
                      : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss"),
                },
                { item: blobs.length },
                {
                  item: (
                    <BlobUsageDisplay
                      blobSize={totalBlobSize}
                      blobUsage={totalBlobUsage}
                      byteUnit={BYTES_UNIT}
                      hideUnit
                    />
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={from}
                      tooltipText="Copy the origin address"
                    >
                      <Link href={buildAddressRoute(from)}>
                        {shortenHash(from)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={to}
                      tooltipText="Copy the destination address"
                    >
                      <Link href={buildAddressRoute(to)}>
                        {shortenHash(to)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <div className="truncate">
                      {formatWei(blobGasBaseFee, {
                        toUnit: "Gwei",
                        hideUnit: true,
                      })}
                    </div>
                  ),
                },
                {
                  item: (
                    <div className="truncate">
                      {formatWei(blobGasMaxFee, {
                        toUnit: "Gwei",
                        hideUnit: true,
                      })}
                    </div>
                  ),
                },
                {
                  item: (
                    <div className="truncate">
                      {formatWei(block.blobGasPrice, {
                        toUnit: "Gwei",
                        hideUnit: true,
                      })}
                    </div>
                  ),
                },
              ],
              expandItem: (
                <Table
                  className="mb-4 mt-2 rounded-lg bg-primary-50 px-8 dark:bg-primary-800"
                  size="xs"
                  alignment="left"
                  headers={[
                    {
                      cells: [
                        {
                          item: "Position",
                          className: "w-[20px]",
                        },
                        {
                          item: "Blob Versioned Hash",
                          className: "w-[400px]",
                        },
                        {
                          item: `Size (${BYTES_UNIT})`,
                          className: "w-[80px] border",
                        },
                        {
                          item: `Usage (${BYTES_UNIT})`,
                          className: "w-[140px]",
                        },
                        {
                          item: "Storages",
                          className: "w-[60px]",
                        },
                      ],
                      className: "dark:border-border-dark/20",
                      sticky: true,
                    },
                  ]}
                  rows={
                    blobs
                      ? blobs.map(
                          (
                            {
                              versionedHash,
                              size,
                              dataStorageReferences,
                              usageSize,
                            },
                            i
                          ) => ({
                            cells: [
                              { item: i },
                              {
                                item: (
                                  <Copyable
                                    value={versionedHash}
                                    tooltipText="Copy blob versioned hash"
                                  >
                                    <Link href={buildBlobRoute(versionedHash)}>
                                      {versionedHash}
                                    </Link>
                                  </Copyable>
                                ),
                              },
                              {
                                item: formatBytes(size, {
                                  unit: BYTES_UNIT,
                                  hideUnit: true,
                                }),
                              },
                              {
                                item: (
                                  <span>
                                    {formatBytes(usageSize, {
                                      unit: BYTES_UNIT,
                                      hideUnit: true,
                                    })}{" "}
                                    <span className="text-contentTertiary-light dark:text-contentTertiary-dark">
                                      ({calculatePercentage(usageSize, size)}
                                      %)
                                    </span>
                                  </span>
                                ),
                              },
                              {
                                item: dataStorageReferences && (
                                  <div className="flex items-center gap-2">
                                    {dataStorageReferences.map(
                                      ({ storage, url }) => (
                                        <StorageBadge
                                          key={storage}
                                          storage={storage}
                                          url={url}
                                          compact
                                        />
                                      )
                                    )}
                                  </div>
                                ),
                              },
                            ],
                            className: "dark:border-border-dark/10",
                          })
                        )
                      : undefined
                  }
                />
              ),
            };
          }
        )
      : undefined;
  }, [transactions, timeFormat]);

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <div>Blob Transactions</div>
          <div>
            {!countIsLoading && totalTransactions !== undefined ? (
              `(${formatNumber(totalTransactions)})`
            ) : (
              <div className="relative left-0 top-1">
                <Skeleton width={100} height={25} />
              </div>
            )}
          </div>
        </div>
      </Header>
      <FiltersBar />
      <PaginatedTable
        emptyStateDescription="No Blob Transactions"
        isLoading={txsIsLoading}
        headers={transactionHeaders}
        rows={transactionRows}
        totalItems={totalTransactions}
        paginationData={{
          pageSize: paginationParams.ps,
          page: paginationParams.p,
        }}
        isExpandable
      />
    </>
  );
};

export default Txs;
