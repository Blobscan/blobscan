import { useMemo, useState } from "react";
import type { NextPage } from "next";

import dayjs from "@blobscan/dayjs";
import { formatWei } from "@blobscan/eth-format";

import { RollupBadge } from "~/components/Badges/RollupBadge";
import { StorageBadge } from "~/components/Badges/StorageBadge";
import { Copyable } from "~/components/Copyable";
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
import type { TransactionWithExpandedBlockAndBlob } from "~/types";
import {
  buildAddressRoute,
  buildBlockRoute,
  buildTransactionRoute,
  formatBytes,
  formatNumber,
  formatTimestamp,
  shortenAddress,
  buildBlobRoute,
} from "~/utils";

const Txs: NextPage = function () {
  const { paginationParams, filterParams } = useQueryParams();
  const rollups = filterParams.rollups?.join(",");
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
          className: "w-[165px]",
        },
        {
          item: "Blobs",
          className: "w-[65px]",
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
          item: "Blob Base Fee",
          className: "w-[172px]",
        },
        {
          item: "Blob Max Fee",
          className: "w-[162px]",
        },
        {
          item: "Blob Gas Price",
          className: "2xl:w-full w-[180px]",
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
                  <Copyable value={hash} tooltipText="Copy hash">
                    <Link href={buildTransactionRoute(hash)}>
                      {shortenAddress(hash, 6)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <Link href={buildBlockRoute(blockNumber)}>{blockNumber}</Link>
                ),
              },
              {
                item:
                  timeFormat === "relative"
                    ? formatTimestamp(blockTimestamp, true)
                    : dayjs(blockTimestamp).format("YYYY-MM-DD HH:mm:ss"),
              },
              {
                item: blobs.length,
              },
              {
                item: (
                  <Copyable value={from} tooltipText="Copy the origin address">
                    <Link href={buildAddressRoute(from)}>
                      {shortenAddress(from, 6)}
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
                      {shortenAddress(to, 6)}
                    </Link>
                  </Copyable>
                ),
              },
              {
                item: (
                  <div className="truncate">
                    {formatWei(blobGasBaseFee, { toUnit: "Gwei" })}
                  </div>
                ),
              },
              {
                item: (
                  <div className="truncate">
                    {formatWei(blobGasMaxFee, { toUnit: "Gwei" })}
                  </div>
                ),
              },
              {
                item: (
                  <div className="truncate">
                    {formatWei(block.blobGasPrice, { toUnit: "Gwei" })}
                  </div>
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
                      {
                        item: "Position",
                      },
                      {
                        item: "Blob Versioned Hash",
                      },
                      {
                        item: "Size",
                      },
                      {
                        item: "Storages",
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
                          { versionedHash, size, dataStorageReferences },
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
                              item: (
                                <div className="flex gap-2">
                                  <span>{formatBytes(size)}</span>
                                </div>
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
          })
        )
      : undefined;
  }, [transactions, timeFormat]);

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
      <Filters />
      <PaginatedTable
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
