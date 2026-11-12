import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";
import { formatWei } from "@blobscan/eth-format";

import { CountBadge } from "~/components/Badges/CountBadge";
import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { ListControlBar } from "~/components/ControlBars/ListControlBar";
import { Copyable } from "~/components/Copyable";
import { BlobUsageDisplay } from "~/components/Displays/BlobUsageDisplay";
import { Header } from "~/components/Header";
import { Link } from "~/components/Link";
import { PaginatedTable } from "~/components/PaginatedTable";
import { SeoMetaTags } from "~/components/SeoMetaTags";
import { Table } from "~/components/Table";
import type { TimestampFormat } from "~/components/Toggles";
import { TimestampToggle } from "~/components/Toggles";
import { api } from "~/api-client";
import { useListPageParams } from "~/hooks/useListPageParams";
import ErrorPage from "~/pages/_error";
import { routes } from "~/routes";
import type { Pagination, TransactionWithExpandedBlockAndBlob } from "~/types";
import type { ByteUnit } from "~/utils";
import {
  formatBytes,
  formatTimestamp,
  shortenHash,
  calculatePercentage,
  toChecksumAddress,
} from "~/utils";

const BYTES_UNIT: ByteUnit = "KiB";

const Txs: NextPage = function () {
  const { pagination, filterParams, sort, isReady } = useListPageParams();
  const {
    data: txsData,
    isLoading: txsIsLoading,
    error: txsError,
  } = api.tx.getAllByCursor.useQuery<{
    transactions: TransactionWithExpandedBlockAndBlob[];
    pagination: Pagination;
  }>(
    {
      ...pagination,
      ...filterParams,
      sort,
      expand: "block,blob",
    },
    { enabled: isReady }
  );
  const { data: countData, error: countError } = api.tx.getCount.useQuery(
    filterParams,
    {
      enabled: isReady,
    }
  );
  const { transactions } = txsData || {};
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
            const checksumFrom = toChecksumAddress(from);
            const checksumTo = toChecksumAddress(to);
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
                      <Link href={routes.tx(hash)}>{shortenHash(hash)}</Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Link href={routes.block(blockNumber)}>{blockNumber}</Link>
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
                      value={checksumFrom}
                      tooltipText="Copy the origin address"
                    >
                      <Link href={routes.address(from)}>
                        {shortenHash(checksumFrom)}
                      </Link>
                    </Copyable>
                  ),
                },
                {
                  item: (
                    <Copyable
                      value={checksumTo}
                      tooltipText="Copy the destination address"
                    >
                      <Link href={routes.address(to)}>
                        {shortenHash(checksumTo)}
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
                                    <Link
                                      href={routes.blob(versionedHash, {
                                        txHash: hash,
                                        index: i,
                                      })}
                                    >
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
      <SeoMetaTags
        title="Blob Transactions"
        description="Browse and explore all blob transactions."
      />
      <Header>
        <div className="flex items-center gap-2">
          <span>Blob Transactions</span>
          <CountBadge count={countData?.totalTransactions} />
        </div>
      </Header>
      <ListControlBar />
      <PaginatedTable
        emptyStateDescription="No Blob Transactions"
        isLoading={txsIsLoading}
        headers={transactionHeaders}
        rows={transactionRows}
        pagination={txsData?.pagination}
        totalItems={countData?.totalTransactions}
        paginationData={pagination}
        isExpandable
      />
    </>
  );
};

export default Txs;
